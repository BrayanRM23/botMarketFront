import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { Bot, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function CreateBotPage() {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('El nombre del bot es obligatorio.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/bots', form);
      toast.success('Bot creado correctamente');
      setForm({ name: '', description: '' });
      navigate('/dashboard/bots');
    } catch (error) {
      const message = error?.response?.data?.message || 'No se pudo crear el bot.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-slate-50">
          <Bot className="h-5 w-5 text-brand-400" />
          Crear nuevo bot
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Define el nombre y el conocimiento base de tu asistente. Puedes editarlo en cualquier
          momento.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 md:p-6">
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
            placeholder="Ej. Asistente de soporte 24/7"
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
            placeholder="Describe el negocio, FAQs, procesos, tono de voz y cualquier información relevante para que el bot responda mejor."
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
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-xs font-medium text-white shadow-lg shadow-brand-600/40 transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Sparkles className="h-4 w-4" />
            {loading ? 'Creando...' : 'Crear bot'}
          </button>
        </div>
      </form>
    </div>
  );
}

