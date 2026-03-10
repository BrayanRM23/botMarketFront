import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Bot, Send, Loader2 } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function ChatPage() {
  const { botId } = useParams();
  const [bot, setBot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchBot = async () => {
      try {
        setError(null);
        const res = await axios.get(`${API_BASE}/bots/public/${botId}`);
        setBot(res.data.bot);
      } catch (err) {
        setError(err?.response?.status === 404 ? 'Bot no encontrado.' : 'No se pudo cargar el asistente.');
      } finally {
        setLoading(false);
      }
    };

    if (botId) fetchBot();
  }, [botId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending || !bot) return;

    setInput('');
    const userMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setSending(true);

    try {
      const res = await axios.post(`${API_BASE}/bots/${botId}/chat`, { message: text });
      setMessages((prev) => [...prev, { role: 'assistant', content: res.data.reply }]);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Error al enviar el mensaje.';
      setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${msg}` }]);
    } finally {
      setSending(false);
    }
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
        <div>
          <h1 className="text-lg font-semibold text-slate-50">{bot.name}</h1>
          <p className="text-xs text-slate-400">Asistente conversacional</p>
        </div>
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
                    : 'border border-slate-700 bg-slate-800/80 text-slate-100'
                }`}
              >
                <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
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
            placeholder="Escribe tu mensaje..."
            className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-50 placeholder:text-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
