import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAuth as useAuthContext } from '../../context/AuthContext.jsx';

export default function DashboardHome() {
  const { user, api } = useAuthContext();
  const [stats, setStats] = useState({ totalBots: 0, totalConversations: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/stats/overview');
        setStats({
          totalBots: res.data.totalBots,
          totalConversations: res.data.totalConversations,
        });
      } catch {
        // para el home podemos ignorar errores y dejar en 0
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
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
            Conversaciones totales
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-50">
            {loading ? '—' : stats.totalConversations}
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

