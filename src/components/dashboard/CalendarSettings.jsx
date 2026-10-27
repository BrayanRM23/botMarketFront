import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  Calendar,
  Link2,
  Link2Off,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const PERMISSION_LABELS = [
  { key: 'viewAvailability', label: 'Ver disponibilidad (libre/ocupado)' },
  { key: 'listEvents', label: 'Listar eventos próximos' },
  { key: 'createEvents', label: 'Crear eventos / citas' },
  { key: 'editEvents', label: 'Editar eventos existentes' },
  { key: 'deleteEvents', label: 'Eliminar eventos' },
  { key: 'createTasks', label: 'Crear tareas (Google Tasks)' },
];

const DURATION_OPTIONS = [
  { value: 15, label: '15 minutos' },
  { value: 30, label: '30 minutos' },
  { value: 45, label: '45 minutos' },
  { value: 60, label: '1 hora' },
  { value: 90, label: '1 hora 30 min' },
  { value: 120, label: '2 horas' },
];

const TIMEZONE_OPTIONS = [
  'America/Bogota',
  'America/Lima',
  'America/Mexico_City',
  'America/Santiago',
  'America/Buenos_Aires',
  'America/Caracas',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/Madrid',
  'UTC',
];

export default function CalendarSettings({ botId }) {
  const { api } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [availableCalendars, setAvailableCalendars] = useState([]);

  const [calData, setCalData] = useState({
    connected: false,
    calendarId: 'primary',
    timezone: 'America/Bogota',
    defaultDuration: 60,
    permissions: {
      viewAvailability: false,
      listEvents: false,
      createEvents: false,
      editEvents: false,
      deleteEvents: false,
      createTasks: false,
    },
    instructions: '',
    customFields: [],
  });

  const [newField, setNewField] = useState('');

  useEffect(() => {
    const fetchCalendar = async () => {
      try {
        const res = await api.get(`/calendar/bots/${botId}`);
        const cal = res.data.calendar || {};
        setCalData((prev) => ({
          ...prev,
          connected: cal.connected || false,
          calendarId: cal.calendarId || 'primary',
          timezone: cal.timezone || 'America/Bogota',
          defaultDuration: cal.defaultDuration || 60,
          permissions: { ...prev.permissions, ...(cal.permissions || {}) },
          instructions: cal.instructions || '',
          customFields: cal.customFields || [],
        }));
        if (cal.connected) setExpanded(true);
      } catch {
        // Si falla, simplemente mostramos el estado desconectado
      } finally {
        setLoading(false);
      }
    };
    fetchCalendar();
  }, [api, botId]);

  useEffect(() => {
    if (!calData.connected) return;
    const fetchCalendars = async () => {
      try {
        const res = await api.get(`/calendar/bots/${botId}/calendars`);
        setAvailableCalendars(res.data.calendars || []);
      } catch {
        // No bloqueante — el usuario puede dejar 'primary'
      }
    };
    fetchCalendars();
  }, [api, botId, calData.connected]);

  const handleConnect = () => {
    const backendBase = API_BASE.replace('/api', '');
    window.location.href = `${backendBase}/api/calendar/auth/${botId}`;
  };

  const handleDisconnect = async () => {
    if (!confirm('¿Desconectar Google Calendar? Se perderá la configuración actual.')) return;
    setDisconnecting(true);
    try {
      await api.delete(`/calendar/bots/${botId}`);
      setCalData((prev) => ({
        ...prev,
        connected: false,
        permissions: {
          viewAvailability: false,
          listEvents: false,
          createEvents: false,
          editEvents: false,
          deleteEvents: false,
          createTasks: false,
        },
        instructions: '',
        customFields: [],
      }));
      setExpanded(false);
      toast.success('Google Calendar desconectado.');
    } catch {
      toast.error('No se pudo desconectar. Intenta de nuevo.');
    } finally {
      setDisconnecting(false);
    }
  };

  const handlePermissionChange = (key) => {
    setCalData((prev) => ({
      ...prev,
      permissions: { ...prev.permissions, [key]: !prev.permissions[key] },
    }));
  };

  const handleAddField = () => {
    const trimmed = newField.trim();
    if (!trimmed || calData.customFields.includes(trimmed)) return;
    setCalData((prev) => ({ ...prev, customFields: [...prev.customFields, trimmed] }));
    setNewField('');
  };

  const handleRemoveField = (field) => {
    setCalData((prev) => ({
      ...prev,
      customFields: prev.customFields.filter((f) => f !== field),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/calendar/bots/${botId}`, {
        permissions: calData.permissions,
        instructions: calData.instructions,
        customFields: calData.customFields,
        defaultDuration: calData.defaultDuration,
        timezone: calData.timezone,
        calendarId: calData.calendarId,
      });
      toast.success('Configuración de Calendar guardada.');
    } catch {
      toast.error('No se pudo guardar la configuración.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
        <Loader2 className="h-4 w-4 animate-spin text-brand-400" />
        <span className="text-sm text-slate-400">Cargando configuración de Calendar...</span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between p-4 md:p-5"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
            <Calendar className="h-5 w-5" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-slate-100">Google Calendar</p>
            <p className="text-xs text-slate-400">
              {calData.connected ? (
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Conectado
                </span>
              ) : (
                'Sin conectar'
              )}
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        )}
      </button>

      {expanded && (
        <div className="space-y-5 border-t border-slate-800 p-4 md:p-5">
          {/* Conectar / Desconectar */}
          {!calData.connected ? (
            <div className="flex flex-col gap-3 rounded-xl border border-slate-700 bg-slate-950/40 p-4">
              <p className="text-sm text-slate-300">
                Conecta tu cuenta de Google para que el asistente pueda gestionar eventos y citas en
                tu calendario.
              </p>
              <button
                type="button"
                onClick={handleConnect}
                className="inline-flex items-center gap-2 self-start rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-500"
              >
                <Link2 className="h-4 w-4" />
                Conectar Google Calendar
              </button>
            </div>
          ) : (
            <>
              {/* Botón desconectar */}
              <div className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-950/40 px-4 py-3">
                <p className="text-sm text-slate-300">
                  Cuenta de Google conectada correctamente.
                </p>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-800/60 bg-red-950/30 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-950/60 disabled:opacity-50"
                >
                  <Link2Off className="h-3.5 w-3.5" />
                  {disconnecting ? 'Desconectando...' : 'Desconectar'}
                </button>
              </div>

              {/* Selección de calendario */}
              <div>
                <label className="block text-sm font-medium text-slate-200">
                  Calendario a usar
                </label>
                <select
                  value={calData.calendarId}
                  onChange={(e) => setCalData((p) => ({ ...p, calendarId: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/40"
                >
                  <option value="primary">Principal (primary)</option>
                  {availableCalendars
                    .filter((c) => c.id !== 'primary')
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.summary}
                      </option>
                    ))}
                </select>
              </div>

              {/* Zona horaria */}
              <div>
                <label className="block text-sm font-medium text-slate-200">Zona horaria</label>
                <select
                  value={calData.timezone}
                  onChange={(e) => setCalData((p) => ({ ...p, timezone: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/40"
                >
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>

              {/* Duración por defecto */}
              <div>
                <label className="block text-sm font-medium text-slate-200">
                  Duración por defecto de los eventos
                </label>
                <select
                  value={calData.defaultDuration}
                  onChange={(e) =>
                    setCalData((p) => ({ ...p, defaultDuration: Number(e.target.value) }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/40"
                >
                  {DURATION_OPTIONS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Permisos */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Permisos del asistente
                </label>
                <div className="space-y-2 rounded-xl border border-slate-700 bg-slate-950/40 p-3">
                  {PERMISSION_LABELS.map(({ key, label }) => (
                    <label key={key} className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={calData.permissions[key] || false}
                        onChange={() => handlePermissionChange(key)}
                        className="h-4 w-4 rounded border-slate-600 bg-slate-800 accent-brand-500"
                      />
                      <span className="text-sm text-slate-300">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Instrucciones personalizadas */}
              <div>
                <label className="block text-sm font-medium text-slate-200">
                  Instrucciones para el asistente
                </label>
                <p className="mt-0.5 text-xs text-slate-500">
                  Explica cómo debe comportarse al gestionar citas. Ej: &quot;Cuando un cliente quiera
                  reservar, pide nombre completo, teléfono y motivo de visita. Propón 3 horarios
                  disponibles y no reserves sin confirmación.&quot;
                </p>
                <textarea
                  rows={5}
                  value={calData.instructions}
                  onChange={(e) => setCalData((p) => ({ ...p, instructions: e.target.value }))}
                  placeholder="Escribe las instrucciones específicas para tu asistente..."
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-600 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/40"
                />
              </div>

              {/* Campos obligatorios */}
              <div>
                <label className="block text-sm font-medium text-slate-200">
                  Campos a recolectar del cliente
                </label>
                <p className="mt-0.5 text-xs text-slate-500">
                  El asistente pedirá estos datos antes de agendar un evento.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {calData.customFields.map((field) => (
                    <span
                      key={field}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-200"
                    >
                      {field}
                      <button
                        type="button"
                        onClick={() => handleRemoveField(field)}
                        className="text-slate-500 hover:text-red-400"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={newField}
                    onChange={(e) => setNewField(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddField())}
                    placeholder="Ej: Nombre completo, Teléfono, Motivo..."
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-600 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/40"
                  />
                  <button
                    type="button"
                    onClick={handleAddField}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white hover:bg-brand-500"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Guardar */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-brand-600/40 transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Calendar className="h-4 w-4" />
                      Guardar configuración
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
