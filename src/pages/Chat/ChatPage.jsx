import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Bot, Send, Loader2, RotateCcw } from 'lucide-react';
import PrivacyNotice from '../../components/chat/PrivacyNotice.jsx';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const DEFAULT_RETENTION_DAYS = 90;
const NETWORK_ERROR_MESSAGE = 'No pude conectarme con el asistente. Revisa tu conexión e intenta de nuevo.';

// Aceptación del aviso de privacidad, por bot. Se envía con cada mensaje para que el
// servidor registre la fecha en la conversación.
function getPrivacyAcceptance(botId) {
  try {
    return localStorage.getItem(`botmarket:privacy:${botId}`);
  } catch {
    return null;
  }
}

function setPrivacyAcceptance(botId, value) {
  try {
    if (value) localStorage.setItem(`botmarket:privacy:${botId}`, value);
    else localStorage.removeItem(`botmarket:privacy:${botId}`);
  } catch {
    // Sin almacenamiento: la aceptación vale solo mientras la página esté abierta
  }
}

function newSessionId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  // randomUUID solo existe en contextos seguros (https o localhost)
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// Si el almacenamiento no está disponible, la conversación funciona pero no sobrevive a recargas
function getSessionId(botId) {
  const key = `botmarket:session:${botId}`;
  try {
    const stored = localStorage.getItem(key);
    if (stored) return stored;
    const created = newSessionId();
    localStorage.setItem(key, created);
    return created;
  } catch {
    return newSessionId();
  }
}

function saveSessionId(botId, sessionId) {
  try {
    localStorage.setItem(`botmarket:session:${botId}`, sessionId);
  } catch {
    // Sin almacenamiento: la sesión vive solo en memoria
  }
}

export default function ChatPage() {
  const { botId } = useParams();
  const [bot, setBot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [privacyAcceptedAt, setPrivacyAcceptedAt] = useState(null);
  const [retentionDays, setRetentionDays] = useState(DEFAULT_RETENTION_DAYS);
  const [showNotice, setShowNotice] = useState(false);
  const [info, setInfo] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!botId) return;

    const load = async () => {
      try {
        setError(null);
        const res = await axios.get(`${API_BASE}/bots/public/${botId}`);
        setBot(res.data.bot);
        setRetentionDays(res.data.retentionDays || DEFAULT_RETENTION_DAYS);
        setPrivacyAcceptedAt(getPrivacyAcceptance(botId));

        const id = getSessionId(botId);
        setSessionId(id);
        // Restaurar la charla anterior si existe. Un fallo aquí no debe impedir chatear.
        try {
          const conv = await axios.get(`${API_BASE}/bots/public/${botId}/conversation/${id}`);
          setMessages(conv.data.messages || []);
        } catch {
          setMessages([]);
        }
      } catch (err) {
        setError(err?.response?.status === 404 ? 'Bot no encontrado.' : 'No se pudo cargar el asistente.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [botId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Solo el texto viaja al servidor: el historial lo guarda y arma el backend
  const requestReply = async (text) => {
    setSending(true);
    try {
      const res = await axios.post(`${API_BASE}/bots/${botId}/chat`, {
        message: text,
        sessionId,
        privacyAcceptedAt,
      });
      setMessages((prev) => [...prev, { role: 'assistant', content: res.data.reply }]);
    } catch (err) {
      const data = err?.response?.data;
      if (data?.code === 'PRIVACY_REQUIRED') {
        setPrivacyAcceptance(botId, null);
        setPrivacyAcceptedAt(null);
      }
      // Sin respuesta del servidor = problema de red, siempre se puede reintentar
      const retryable = !err?.response || Boolean(data?.retryable);
      const content = err?.response ? data?.message || 'No pude responder a tu mensaje.' : NETWORK_ERROR_MESSAGE;
      // Los errores se muestran solo en la UI; no se guardan en el historial del servidor
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content, isError: true, retryText: retryable ? text : undefined },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleAcceptPrivacy = () => {
    const acceptedAt = new Date().toISOString();
    setPrivacyAcceptance(botId, acceptedAt);
    setPrivacyAcceptedAt(acceptedAt);
    setShowNotice(false);
  };

  const handleDeleteConversation = async () => {
    if (sending || !sessionId) return;
    if (!window.confirm('¿Borrar tu conversación con este asistente? No se puede deshacer.')) return;
    try {
      await axios.delete(`${API_BASE}/bots/public/${botId}/conversation/${sessionId}`);
      const id = newSessionId();
      saveSessionId(botId, id);
      setSessionId(id);
      setMessages([]);
      setInfo('Tu conversación fue eliminada.');
    } catch {
      setInfo('No se pudo borrar la conversación. Intenta de nuevo.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending || !bot || !privacyAcceptedAt) return;
    setInfo('');

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    await requestReply(text);
  };

  // El mensaje de error va justo después del mensaje del usuario que lo causó
  const handleRetry = async (index) => {
    if (sending || !privacyAcceptedAt) return;
    const text = messages[index].retryText;
    setMessages((prev) => prev.filter((_, i) => i !== index));
    await requestReply(text);
  };

  const handleNewConversation = () => {
    if (sending) return;
    const id = newSessionId();
    saveSessionId(botId, id);
    setSessionId(id);
    setMessages([]);
    setInfo('');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          <p className="text-sm">Cargando asistente...</p>
        </div>
      </div>
    );
  }

  if (error || !bot) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="rounded-2xl border border-slate-700 bg-slate-900/80 px-6 py-8 text-center">
          <p className="text-slate-200">{error || 'Bot no encontrado.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Cabecera fija sin enlaces al admin */}
      <header className="flex shrink-0 items-center gap-3 border-b border-slate-800 bg-slate-950/90 px-4 py-3 backdrop-blur-sm">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-cyan-500 text-white">
          <Bot className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold text-slate-50">{bot.name}</h1>
          <p className="text-xs text-slate-400">Asistente conversacional</p>
        </div>
        <button
          type="button"
          onClick={handleNewConversation}
          disabled={sending || messages.length === 0}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Nueva conversación
        </button>
      </header>

      {/* Área de mensajes */}
      <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6">
        <div className="mx-auto max-w-2xl space-y-4">
          {messages.length === 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-6 text-center">
              <p className="text-sm text-slate-400">
                Escribe un mensaje para empezar la conversación con <strong className="text-slate-300">{bot.name}</strong>.
              </p>
              {bot.description && (
                <p className="mt-2 line-clamp-2 text-xs text-slate-500">
                  {bot.description.slice(0, 120)}…
                </p>
              )}
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                  msg.role === 'user'
                    ? 'bg-brand-600 text-white'
                    : msg.isError
                      ? 'border border-red-800/60 bg-red-950/30 text-red-200'
                      : 'border border-slate-700 bg-slate-800/80 text-slate-100'
                }`}
              >
                <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                {msg.retryText && (
                  <button
                    type="button"
                    onClick={() => handleRetry(i)}
                    disabled={sending}
                    className="mt-2 text-xs font-medium text-brand-400 hover:text-brand-300 disabled:opacity-50"
                  >
                    Reintentar
                  </button>
                )}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-800/80 px-4 py-2.5">
                <Loader2 className="h-4 w-4 animate-spin text-brand-400" />
                <span className="text-sm text-slate-400">Pensando...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Aviso de privacidad: obligatorio antes del primer mensaje, consultable después */}
      {(!privacyAcceptedAt || showNotice) && (
        <div className="shrink-0 px-4 pb-3 md:px-6">
          <div className="mx-auto max-h-[50vh] max-w-2xl overflow-y-auto">
            <PrivacyNotice
              botName={bot.name}
              retentionDays={retentionDays}
              onAccept={privacyAcceptedAt ? null : handleAcceptPrivacy}
              onClose={privacyAcceptedAt ? () => setShowNotice(false) : null}
            />
          </div>
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="shrink-0 border-t border-slate-800 bg-slate-950/90 px-4 py-3 backdrop-blur-sm md:px-6"
      >
        <div className="mx-auto flex max-w-2xl gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={privacyAcceptedAt ? 'Escribe tu mensaje...' : 'Acepta el aviso de privacidad para escribir'}
            maxLength={4000}
            className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-50 placeholder:text-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:cursor-not-allowed"
            disabled={sending || !privacyAcceptedAt}
          />
          <button
            type="submit"
            disabled={sending || !input.trim() || !privacyAcceptedAt}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Enviar"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <div className="mx-auto mt-2 flex max-w-2xl flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          {privacyAcceptedAt && (
            <button type="button" onClick={() => setShowNotice((v) => !v)} className="underline-offset-2 hover:text-slate-300 hover:underline">
              Aviso de privacidad
            </button>
          )}
          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleDeleteConversation}
              disabled={sending}
              className="underline-offset-2 hover:text-red-300 hover:underline disabled:opacity-50"
            >
              Borrar mi conversación
            </button>
          )}
          {info && <span className="text-slate-400">{info}</span>}
        </div>
      </form>
    </div>
  );
}
