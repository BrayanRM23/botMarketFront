import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Toaster, toast } from 'react-hot-toast';
import { Bot, UserPlus } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success('Cuenta creada y sesión iniciada');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      const message =
        error?.response?.data?.message || 'No se pudo registrar. Revisa los datos ingresados.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <Toaster position="top-right" />
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl shadow-brand-500/20 backdrop-blur-xl sm:p-10">
          <div className="mb-6 flex items-center gap-2 text-brand-400">
            <Bot className="h-6 w-6" />
            <span className="text-sm font-semibold uppercase tracking-widest">
              Crea tu cuenta en Bot Market
            </span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
            Regístrate
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Configura tu cuenta de administrador para comenzar a crear asistentes de IA
            personalizados.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-200" htmlFor="fullName">
                Nombre completo
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                value={form.fullName}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 shadow-sm outline-none ring-0 transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/40"
                placeholder="Ej. Juan Pérez"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200" htmlFor="phone">
                Teléfono
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                value={form.phone}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 shadow-sm outline-none ring-0 transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/40"
                placeholder="+34 600 000 000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 shadow-sm outline-none ring-0 transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/40"
                placeholder="tucorreo@ejemplo.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200" htmlFor="password">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={form.password}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 shadow-sm outline-none ring-0 transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/40"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200" htmlFor="confirmPassword">
                Confirmar contraseña
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={form.confirmPassword}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 shadow-sm outline-none ring-0 transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/40"
                placeholder="Repite la contraseña"
              />
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-brand-600/40 transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <UserPlus className="h-4 w-4" />
                {loading ? 'Creando cuenta...' : 'Crear cuenta'}
              </button>
            </div>
          </form>

          <p className="mt-4 text-sm text-slate-400">
            ¿Ya tienes cuenta?{' '}
            <Link to="/" className="font-medium text-brand-400 hover:text-brand-300">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

