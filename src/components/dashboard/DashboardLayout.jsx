import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Bot, BarChart3, LayoutDashboard, LogOut, MessageSquarePlus, PanelsTopLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/', { replace: true });
    } catch {
      // Silenciar error; el contexto ya se encarga de limpiar el estado
    }
  };

  const navLinkClasses = ({ isActive }) =>
    [
      'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
      isActive
        ? 'bg-slate-800 text-slate-50'
        : 'text-slate-300 hover:bg-slate-800/70 hover:text-slate-50',
    ].join(' ');

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-slate-800 bg-slate-950/90 px-4 py-6 md:flex">
        <div className="flex items-center gap-2 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-cyan-400 text-slate-950">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">Bot Market</p>
            <p className="text-xs text-slate-400">Admin Dashboard</p>
          </div>
        </div>

        <nav className="mt-8 flex-1 space-y-1">
          <NavLink to="/dashboard" end className={navLinkClasses}>
            <LayoutDashboard className="h-4 w-4" />
            <span>Dashboard Home</span>
          </NavLink>
          <NavLink to="/dashboard/create" className={navLinkClasses}>
            <MessageSquarePlus className="h-4 w-4" />
            <span>Crear nuevo Bot</span>
          </NavLink>
          <NavLink to="/dashboard/bots" className={navLinkClasses}>
            <PanelsTopLeft className="h-4 w-4" />
            <span>Mis Bots</span>
          </NavLink>
          <NavLink to="/dashboard/stats" className={navLinkClasses}>
            <BarChart3 className="h-4 w-4" />
            <span>Estadísticas</span>
          </NavLink>
        </nav>

        <div className="mt-6 border-t border-slate-800 pt-4">
          <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-900/80 px-3 py-2.5">
            <div>
              <p className="text-sm font-medium leading-tight">{user?.fullName}</p>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700"
              title="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-h-screen flex-1 flex-col">
        {/* Top bar for mobile */}
        <header className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 py-3 md:px-6">
          <Link to="/dashboard" className="flex items-center gap-2 md:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-cyan-400 text-slate-950">
              <Bot className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold">Bot Market</span>
          </Link>

          <div className="flex flex-1 items-center justify-end gap-3 md:justify-between">
            <div className="hidden items-center gap-2 text-xs text-slate-400 md:flex">
              <span>Bienvenido,</span>
              <span className="font-medium text-slate-50">{user?.fullName}</span>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 ring-1 ring-slate-700 hover:bg-slate-800"
            >
              <LogOut className="h-3 w-3" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

