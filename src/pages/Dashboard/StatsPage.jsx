import { useEffect, useState } from 'react';
import { BarChart3, CalendarDays, MessageSquare, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const RANGES = [7, 30, 90];

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('es-CO', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Bogota',
  });
}

function formatDay(key) {
  const [, month, day] = key.split('-');
  return `${day}/${month}`;
}

function KpiCard({ label, value, hint, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-brand-400" />}
      </div>
      <p className="mt-2 text-3xl font-semibold text-slate-50">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function ConversationsChart({ series }) {
  const max = Math.max(1, ...series.map((s) => s.count));
  const barWidth = 7;
  const gap = 3;
  const height = 120;
  const width = series.length * (barWidth + gap);

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-40 w-full"
        role="img"
        aria-label="Conversaciones iniciadas por día"
      >
        {series.map((point, i) => {
          const barHeight = (point.count / max) * (height - 4);
          return (
            <rect
              key={point.date}
              x={i * (barWidth + gap)}
              y={height - barHeight}
              width={barWidth}
              height={Math.max(barHeight, 0)}
              rx={1.5}
              className="fill-brand-500"
            >
              <title>{`${formatDay(point.date)}: ${point.count} conversación(es)`}</title>
            </rect>
          );
        })}
      </svg>
      <div className="mt-2 flex justify-between text-xs text-slate-500">
        <span>{series.length ? formatDay(series[0].date) : ''}</span>
        <span>Máximo por día: {max}</span>
        <span>{series.length ? formatDay(series[series.length - 1].date) : ''}</span>
      </div>
    </div>
  );
}

export default function StatsPage() {
  const { api } = useAuth();
  const [days, setDays] = useState(30);
  const [botId, setBotId] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await api.get('/stats/overview', {
          params: { days, ...(botId && { botId }) },
        });
        if (!cancelled) setData(res.data);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [api, days, botId, reloadKey]);

  const kpis = data?.kpis;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-slate-50">
          <BarChart3 className="h-5 w-5 text-brand-400" />
          Estadísticas
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Conversaciones iniciadas en el periodo elegido. Hora de Colombia.
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <select
          value={botId}
          onChange={(e) => setBotId(e.target.value)}
          className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-brand-500 focus:outline-none"
          aria-label="Bot"
        >
          <option value="">Todos los bots</option>
          {(data?.bots || []).map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <div className="inline-flex overflow-hidden rounded-xl border border-slate-700">
          {RANGES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setDays(value)}
              className={`px-4 py-2 text-xs font-medium transition ${
                days === value ? 'bg-brand-600 text-white' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {value} días
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-800/50 bg-red-950/30 px-4 py-3">
          <p className="text-sm text-red-300">No se pudieron cargar las estadísticas.</p>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="flex items-center gap-1.5 rounded-lg border border-red-800 px-3 py-1.5 text-xs text-red-200 hover:bg-red-900/40"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reintentar
          </button>
        </div>
      )}

      {loading && !data && <p className="text-sm text-slate-400">Cargando estadísticas...</p>}

      {data && (
        <>
          {/* Indicadores */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard label="Conversaciones" value={kpis.conversations} icon={MessageSquare} />
            <KpiCard label="Mensajes de clientes" value={kpis.clientMessages} />
            <KpiCard
              label="Mensajes por conversación"
              value={kpis.avgMessagesPerConversation}
              hint="Promedio de mensajes del cliente"
            />
            <KpiCard
              label="Citas creadas"
              value={kpis.calendarEnabled ? kpis.calendarCreated : '—'}
              hint={kpis.calendarEnabled ? 'Por el asistente en Calendar' : 'Calendar no está conectado'}
              icon={CalendarDays}
            />
          </div>
          <p className="text-xs text-slate-500">
            Total histórico: {data.totalConversations} conversaciones desde que se creó cada bot.
          </p>

          {/* Gráfica */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 md:p-6">
            <p className="text-sm font-medium text-slate-200">Conversaciones por día</p>
            <div className="mt-4">
              {kpis.conversations > 0 ? (
                <ConversationsChart series={data.series} />
              ) : (
                <p className="text-sm text-slate-400">
                  Aún no hay conversaciones en este periodo. Comparte el enlace del chat de tu bot para empezar.
                </p>
              )}
            </div>
          </div>

          {/* Preguntas y temas */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 md:p-6">
              <p className="text-sm font-medium text-slate-200">Preguntas que más se repiten</p>
              <p className="mt-1 text-xs text-slate-500">
                Mensajes idénticos que aparecen al menos dos veces. Los correos y teléfonos se excluyen.
              </p>
              <div className="mt-4 space-y-3">
                {data.topQuestions.map((item) => (
                  <div key={item.question} className="flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-sm text-slate-300" title={item.question}>
                      {item.question}
                    </p>
                    <span className="shrink-0 rounded-full bg-brand-600/20 px-2.5 py-0.5 text-xs font-medium text-brand-300">
                      {item.count}×
                    </span>
                  </div>
                ))}
                {data.topQuestions.length === 0 && (
                  <p className="text-xs text-slate-400">Todavía no hay preguntas repetidas en este periodo.</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 md:p-6">
              <p className="text-sm font-medium text-slate-200">Temas más consultados</p>
              <p className="mt-1 text-xs text-slate-500">Palabras clave que aparecen en al menos dos mensajes.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {data.topTopics.map((item) => (
                  <span
                    key={item.topic}
                    className="rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs text-slate-200"
                  >
                    {item.topic} <span className="text-slate-500">· {item.count}</span>
                  </span>
                ))}
                {data.topTopics.length === 0 && (
                  <p className="text-xs text-slate-400">Todavía no hay temas repetidos en este periodo.</p>
                )}
              </div>
            </div>
          </div>

          {/* Desglose por bot */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 md:p-6">
            <p className="text-sm font-medium text-slate-200">Detalle por bot</p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="py-2 pr-4 font-medium">Bot</th>
                    <th className="py-2 pr-4 font-medium">Conversaciones</th>
                    <th className="py-2 pr-4 font-medium">Mensajes</th>
                    <th className="py-2 pr-4 font-medium">Última actividad</th>
                    <th className="py-2 pr-4 font-medium">Documentos</th>
                    <th className="py-2 font-medium">Calendar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {data.perBot.map((bot) => (
                    <tr key={bot.id}>
                      <td className="py-2 pr-4 font-medium text-slate-100">{bot.name}</td>
                      <td className="py-2 pr-4">{bot.conversations}</td>
                      <td className="py-2 pr-4">{bot.clientMessages}</td>
                      <td className="py-2 pr-4">{formatDateTime(bot.lastActivity)}</td>
                      <td className="py-2 pr-4">{bot.documents}</td>
                      <td className="py-2">{bot.calendarConnected ? `${bot.calendarCreated} citas` : 'No conectado'}</td>
                    </tr>
                  ))}
                  {data.perBot.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-xs text-slate-400">
                        Todavía no tienes bots.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
