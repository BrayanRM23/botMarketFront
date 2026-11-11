import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function DashboardHome() {
  const { user, api } = useAuth();
  const [weekConversations, setWeekConversations] = useState(null);
  const [stats, setStats] = useState({ totalBots: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await api.get('/stats/overview', { params: { days: 7 } });
        if (cancelled) return;
        setStats({ totalBots: res.data.totalBots });
        setWeekConversations(res.data.kpis.conversations);
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
  }, [api]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
          Hola, {user?.fullName}
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Bienvenido a tu panel de Bot Market. Desde aquí puedes crear, gestionar y analizar tus
          asistentes de IA.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Bots creados
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-50">
            {loading ? '—' : stats.totalBots}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Conversaciones (7 días)
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-50">
            {loading ? '—' : error ? 'Sin datos' : weekConversations}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Estado
          </p>
          <p className="mt-2 text-sm text-emerald-400">Todo listo para crear tu siguiente bot ✨</p>
        </div>
      </div>
    </div>
  );
}
