import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Toaster, toast } from 'react-hot-toast';
import { Bot, LogIn } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Sesión iniciada correctamente');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      const message =
        error?.response?.data?.message || 'No se pudo iniciar sesión. Revisa tus credenciales.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <Toaster position="top-right" />
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full gap-10 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl shadow-brand-500/20 backdrop-blur-xl sm:grid-cols-2 sm:p-10">
          {/* Left: Login form */}
          <div className="flex flex-col justify-center">
            <div className="mb-6 flex items-center gap-2 text-brand-400">
              <Bot className="h-6 w-6" />
              <span className="text-sm font-semibold uppercase tracking-widest">
                Bot Market Admin
              </span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
              Inicia sesión en tu panel
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Gestiona tus asistentes de IA, crea nuevos bots y revisa estadísticas en un solo
              lugar.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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
                  autoComplete="current-password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 shadow-sm outline-none ring-0 transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/40"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-brand-600/40 transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <LogIn className="h-4 w-4" />
                {loading ? 'Entrando...' : 'Iniciar sesión'}
              </button>
            </form>

            <p className="mt-4 text-sm text-slate-400">
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="font-medium text-brand-400 hover:text-brand-300">
                Regístrate aquí
              </Link>
            </p>
          </div>

          {/* Right: Hero content */}
          <div className="relative hidden flex-col justify-between overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-br from-brand-700/80 via-slate-900 to-slate-950 p-6 text-slate-50 sm:flex">
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-500/40 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 right-10 h-72 w-72 rounded-full bg-cyan-400/30 blur-3xl" />

            <div>
              <h2 className="text-3xl font-semibold tracking-tight">
                Bienvenido a <span className="text-cyan-300">Bot Market</span>
              </h2>
              <p className="mt-3 text-sm text-slate-100/90">
                Crea tu propio asistente de IA en minutos. Centraliza el conocimiento de tu negocio
                y ofrece respuestas inteligentes 24/7 a tus usuarios.
              </p>

              <div className="mt-6 space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-300" />
                  <p>Construye y gestiona múltiples bots, cada uno con su propio contexto.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  <p>Analiza las preguntas más frecuentes y entiende mejor a tus usuarios.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-300" />
                  <p>Comparte URLs públicas de chat para que cualquiera pueda hablar con tus bots.</p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-slate-50 backdrop-blur hover:bg-white/20"
              >
                <LogIn className="h-3 w-3" />
                Iniciar sesión
              </button>
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="inline-flex items-center gap-2 rounded-full bg-slate-950/70 px-4 py-2 text-xs font-medium text-slate-100 ring-1 ring-white/15 backdrop-blur hover:bg-slate-900"
              >
                Crear cuenta
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

