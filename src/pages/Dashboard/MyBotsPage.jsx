import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Pencil, PanelsTopLeft } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext.jsx';

export default function MyBotsPage() {
  const { api } = useAuth();
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBots = async () => {
      try {
        const res = await api.get('/bots');
        setBots(res.data.bots || []);
      } catch (error) {
        const message = error?.response?.data?.message || 'No se pudieron cargar tus bots.';
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchBots();
  }, [api]);

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-slate-50">
            <PanelsTopLeft className="h-5 w-5 text-brand-400" />
            Mis bots
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Gestiona todos los asistentes que has creado y abre sus chats públicos.
          </p>
        </div>
        <Link
          to="/dashboard/create"
          className="hidden rounded-xl bg-brand-600 px-4 py-2 text-xs font-medium text-white shadow-md shadow-brand-600/40 transition hover:bg-brand-500 md:inline-flex"
        >
          Crear nuevo bot
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Cargando bots...</p>
      ) : bots.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center">
          <p className="text-sm text-slate-300">Todavía no has creado ningún bot.</p>
          <p className="mt-1 text-xs text-slate-500">
            Crea tu primer asistente para comenzar a recopilar conversaciones.
          </p>
          <Link
            to="/dashboard/create"
            className="mt-4 inline-flex rounded-xl bg-brand-600 px-4 py-2 text-xs font-medium text-white shadow-md shadow-brand-600/40 transition hover:bg-brand-500"
          >
            Crear bot ahora
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {bots.map((bot) => (
            <div
              key={bot._id}
              className="flex h-full flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/70 p-4"
            >
              <div>
                <h2 className="text-base font-semibold text-slate-50">{bot.name}</h2>
                <p className="mt-1 line-clamp-3 text-xs text-slate-400">{bot.description}</p>
                <p className="mt-3 text-[11px] uppercase tracking-wide text-slate-500">
                  Creado el{' '}
                  {bot.createdAt ? new Date(bot.createdAt).toLocaleDateString() : '—'}
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between gap-2">
                <Link
                  to={`/dashboard/bots/${bot._id}/edit`}
                  className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 ring-1 ring-slate-700 hover:bg-slate-800"
                >
                  <Pencil className="h-3 w-3" />
                  Editar
                </Link>
                <a
                  href={`/chat/${bot._id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-xl bg-brand-600 px-3 py-1.5 text-xs font-medium text-white shadow-md shadow-brand-600/40 hover:bg-brand-500"
                >
                  <ExternalLink className="h-3 w-3" />
                  Abrir chat
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

