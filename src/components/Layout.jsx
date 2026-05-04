import { Link, Outlet, useLocation } from 'react-router-dom';
import { Bell, LayoutDashboard, BadgeCheck, QrCode, BarChart3, LogOut, X, CheckCircle, Clock, Menu } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useRef } from 'react';

// ── Notifications Panel ────────────────────────────────────────────────────
function NotificationsPanel({ onClose }) {
  const [asistencias, setAsistencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const panelRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/asistencias');
        const data = await res.json();
        setAsistencias(data.slice(0, 10));
      } catch {
        setAsistencias([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const today = new Date().toISOString().split('T')[0];
  const todayCount = asistencias.filter(a => a.fecha === today).length;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden animate-fade-in z-50"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div>
          <h3 className="font-black text-on-surface headline-font text-base">Notificaciones</h3>
          {todayCount > 0 && (
            <p className="text-xs text-primary font-semibold mt-0.5">
              {todayCount} asistencia{todayCount !== 1 ? 's' : ''} registrada{todayCount !== 1 ? 's' : ''} hoy
            </p>
          )}
        </div>
        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-surface-container-low transition-colors text-slate-400">
          <X size={16} />
        </button>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {loading ? (
          <div className="px-5 py-8 text-center text-slate-400 text-sm">Cargando...</div>
        ) : asistencias.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Bell size={32} className="mx-auto text-slate-200 mb-3" />
            <p className="text-slate-400 font-semibold text-sm">No hay registros aún.</p>
          </div>
        ) : (
          asistencias.map((a, i) => {
            const isToday = a.fecha === today;
            const initials = a.nombres.charAt(0) + a.apellidos.charAt(0);
            return (
              <div key={i} className={clsx('flex items-start gap-3 px-5 py-3 border-b border-slate-50 hover:bg-surface-container-low', isToday && 'bg-primary/[0.03]')}>
                <div className={clsx('w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5', isToday ? 'bg-primary text-white' : 'bg-primary/10 text-primary')}>
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-on-surface truncate">{a.nombres} {a.apellidos}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <CheckCircle size={11} className={isToday ? 'text-green-500' : 'text-slate-400'} />
                    <span className={clsx('text-xs font-semibold', isToday ? 'text-green-600' : 'text-slate-500')}>Asistencia registrada</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-mono text-slate-400">{a.fecha}</span>
                    <Clock size={9} className="text-slate-300" />
                    <span className="text-[10px] font-mono text-slate-400">{a.hora}</span>
                  </div>
                </div>
                {isToday && <span className="text-[10px] font-black uppercase bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex-shrink-0 mt-1">Hoy</span>}
              </div>
            );
          })
        )}
      </div>
      <div className="px-5 py-3 bg-surface-container-low/50 border-t border-slate-100">
        <Link to="/reportes" onClick={onClose} className="text-xs font-bold text-primary hover:text-primary-container transition-colors">
          Ver reporte completo →
        </Link>
      </div>
    </div>
  );
}

// ── Main Layout ────────────────────────────────────────────────────────────
export default function Layout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { path: '/dashboard', label: 'Panel', icon: LayoutDashboard },
    { path: '/directorio', label: 'Directorio', icon: BadgeCheck },
    { path: '/qr', label: 'Generar QR', icon: QrCode },
    { path: '/reportes', label: 'Reportes', icon: BarChart3 },
  ];

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/asistencias');
        const data = await res.json();
        setUnreadCount(data.filter(a => a.fecha === today).length);
      } catch { /* ignore */ }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close sidebar when route changes on mobile
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-surface">

      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar (desktop: always visible | mobile: drawer) ── */}
      <aside className={clsx(
        'fixed left-0 top-0 h-screen w-64 flex flex-col bg-slate-50 z-50 transition-transform duration-300 no-print',
        'md:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Sidebar brand */}
        <div className="px-8 pt-8 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 headline-font leading-tight">Gestión de Asistencia</h2>
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mt-1">Sistema Pulso Eléctrico</p>
          </div>
          <button className="md:hidden p-1 text-slate-500" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 flex flex-col gap-1 pt-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  'flex items-center gap-4 py-3 px-8 rounded-r-full mr-4 transition-all hover:translate-x-1',
                  isActive ? 'bg-slate-100 text-slate-900 font-bold border-l-4 border-primary' : 'text-slate-600 hover:bg-slate-100 font-semibold'
                )}
              >
                <Icon size={20} className={isActive ? 'text-primary' : 'text-slate-500'} />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="px-6 pb-8 mt-auto">
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                {user?.nombres?.charAt(0)}{user?.apellidos?.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-on-surface truncate">{user?.nombres} {user?.apellidos}</p>
                <p className="text-xs text-primary font-semibold truncate">@{user?.usuario}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors font-bold text-xs border border-red-100"
            >
              <LogOut size={14} /> Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      {/* ── Top Header ── */}
      <header className="fixed top-0 right-0 z-40 w-full md:w-[calc(100%-16rem)] bg-white/90 backdrop-blur-xl shadow-[0_4px_20px_rgba(181,0,11,0.06)] flex justify-between items-center px-4 sm:px-8 py-4 no-print transition-all duration-300">
        <div className="flex items-center gap-3">
          {/* Hamburger (mobile only) */}
          <button
            className="md:hidden p-2 rounded-xl hover:bg-surface-container-low transition-colors text-on-surface"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>
          <span className="text-xl sm:text-2xl font-black text-primary tracking-tighter headline-font">CORPOELEC</span>
          <span className="hidden sm:block text-lg font-black text-slate-800 tracking-tighter headline-font border-l-2 border-slate-200 pl-4 ml-2">
            Asistencia Digital
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen(v => !v)}
              className="relative p-2 text-tertiary hover:text-primary transition-colors rounded-xl hover:bg-surface-container-low"
              title="Notificaciones"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {notifOpen && <NotificationsPanel onClose={() => setNotifOpen(false)} />}
          </div>

          {/* User */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <span className="text-sm font-bold text-on-surface">{user?.nombres} {user?.apellidos}</span>
              <span className="text-xs text-on-surface-variant font-medium">@{user?.usuario}</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm border-2 border-primary/20">
              {user?.nombres?.charAt(0)}{user?.apellidos?.charAt(0)}
            </div>
            <button
              onClick={logout}
              title="Cerrar sesión"
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-surface-container-low text-on-surface-variant hover:bg-red-50 hover:text-red-600 transition-all font-semibold text-xs border border-slate-200 hover:border-red-200"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="w-full min-h-screen md:ml-64 px-4 sm:px-8 lg:px-12 pt-20 pb-24 md:pb-8 animate-fade-in">
        <div className="max-w-7xl mx-auto py-6">
          <Outlet />
        </div>
      </main>

      {/* ── Bottom Navigation (mobile only) ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] no-print">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  'flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all min-w-[60px]',
                  isActive ? 'text-primary' : 'text-slate-400'
                )}
              >
                <div className={clsx('p-1.5 rounded-xl transition-all', isActive && 'bg-primary/10')}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="text-[10px] font-bold">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
