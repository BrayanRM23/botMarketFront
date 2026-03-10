import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function StatsPage() {
  const { api } = useAuth();
  const [stats, setStats] = useState({
    totalBots: 0,
    totalConversations: 0,
    topQuestions: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/stats/overview');
        setStats({
          totalBots: res.data.totalBots,
          totalConversations: res.data.totalConversations,
          topQuestions: res.data.topQuestions || [],
        });
      } catch {
        // para las stats podemos seguir con los valores por defecto
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [api]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-slate-50">
          <BarChart3 className="h-5 w-5 text-brand-400" />
          Estadísticas
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Visualiza el rendimiento de tus bots y las preguntas más frecuentes.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Bots creados
          </p>
          <p className="mt-2 text-3xl font-semibold text-slate-50">
            {loading ? '—' : stats.totalBots}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Conversaciones totales
          </p>
          <p className="mt-2 text-3xl font-semibold text-slate-50">
            {loading ? '—' : stats.totalConversations}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Actividad general
          </p>
          <p className="mt-2 text-sm text-emerald-400">
            {loading ? 'Calculando...' : 'Tus bots están listos para hablar.'}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 md:p-6">
        <p className="text-sm font-medium text-slate-200">Preguntas más frecuentes (dummy)</p>
        <p className="mt-1 text-xs text-slate-500">
          Estos datos son de ejemplo. Más adelante puedes conectarlos a conversaciones reales.
        </p>

        <div className="mt-4 space-y-3">
          {stats.topQuestions.map((item) => (
            <div key={item.question} className="flex items-center gap-3">
              <div className="relative h-2 flex-1 rounded-full bg-slate-800">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand-500 to-cyan-400"
                  style={{
                    width: `${Math.min(100, item.count * 4)}%`,
                  }}
                />
              </div>
              <div className="w-24 text-right text-xs text-slate-300">{item.question}</div>
            </div>
          ))}
          {stats.topQuestions.length === 0 && !loading && (
            <p className="text-xs text-slate-400">Todavía no hay datos de preguntas frecuentes.</p>
          )}
        </div>
      </div>
    </div>
  );
}

