import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { Pencil } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function EditBotPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { api } = useAuth();

  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchBot = async () => {
      try {
        const res = await api.get(`/bots/${id}`);
        setForm({ name: res.data.bot.name, description: res.data.bot.description || '' });
      } catch (error) {
        const message = error?.response?.data?.message || 'No se pudo cargar el bot.';
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchBot();
  }, [api, id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/bots/${id}`, form);
      toast.success('Bot actualizado correctamente');
      navigate('/dashboard/bots');
    } catch (error) {
      const message = error?.response?.data?.message || 'No se pudo actualizar el bot.';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-400">Cargando bot...</p>;
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-slate-50">
          <Pencil className="h-5 w-5 text-brand-400" />
          Editar bot
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Actualiza el nombre y el contexto de tu asistente.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 md:p-6"
      >
        <div>
          <label className="block text-sm font-medium text-slate-200" htmlFor="name">
            Nombre del bot
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={form.name}
            onChange={handleChange}
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 shadow-sm outline-none ring-0 transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/40"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-200" htmlFor="description">
            Descripción / Base de conocimiento
          </label>
          <textarea
            id="description"
            name="description"
            rows={8}
            value={form.description}
            onChange={handleChange}
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 shadow-sm outline-none ring-0 transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/40"
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard/bots')}
            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-xs font-medium text-white shadow-lg shadow-brand-600/40 transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Pencil className="h-4 w-4" />
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}

