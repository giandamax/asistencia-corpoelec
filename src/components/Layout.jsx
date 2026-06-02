import { Link, Outlet, useLocation } from 'react-router-dom';
import { Bell, LayoutDashboard, BadgeCheck, UserCheck, QrCode, BarChart3, Settings, LogOut, X, CheckCircle, Clock, Menu } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import CorpoelecLogo from './CorpoelecLogo';
 
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
 
// ── Animated Parallax Background ──────────────────────────────────────────
function ParallaxBackground() {
  const orb1 = useRef(null);
  const orb2 = useRef(null);
  const orb3 = useRef(null);
  const mouse = useRef({ x: 0.5, y: 0.5 });
  const current = useRef({ x: 0.5, y: 0.5 });
  const rafId = useRef(null);

  useEffect(() => {
    const handleMove = (e) => {
      mouse.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };
    };
    window.addEventListener('mousemove', handleMove, { passive: true });

    const ease = 0.055; // suavidad del seguimiento
    const animate = () => {
      current.current.x += (mouse.current.x - current.current.x) * ease;
      current.current.y += (mouse.current.y - current.current.y) * ease;

      const cx = current.current.x;
      const cy = current.current.y;

      if (orb1.current) {
        orb1.current.style.transform =
          `translate(${cx * 60 - 30}px, ${cy * 60 - 30}px)`;
      }
      if (orb2.current) {
        orb2.current.style.transform =
          `translate(${cx * -80 + 40}px, ${cy * -80 + 40}px)`;
      }
      if (orb3.current) {
        orb3.current.style.transform =
          `translate(${cx * 45 - 22}px, ${cy * -50 + 25}px)`;
      }
      rafId.current = requestAnimationFrame(animate);
    };
    rafId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden
    >
      {/* Fondo base degradado oscuro-azul */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(145deg, #f0f4ff 0%, #e8edf8 40%, #f5f0f8 70%, #edf2ff 100%)'
      }} />

      {/* Orbe 1 – Azul corporativo grande (esquina superior izquierda) */}
      <div
        ref={orb1}
        className="absolute will-change-transform"
        style={{
          width: '70vw',
          height: '70vw',
          top: '-20vw',
          left: '-15vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 40% 40%, rgba(0,43,103,0.18) 0%, rgba(0,43,103,0.07) 50%, transparent 75%)',
          filter: 'blur(40px)',
          transition: 'transform 0.1s linear',
        }}
      />

      {/* Orbe 2 – Rojo Corpoelec (esquina inferior derecha) */}
      <div
        ref={orb2}
        className="absolute will-change-transform"
        style={{
          width: '60vw',
          height: '60vw',
          bottom: '-10vw',
          right: '-10vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 60% 60%, rgba(181,0,11,0.13) 0%, rgba(181,0,11,0.05) 55%, transparent 78%)',
          filter: 'blur(50px)',
          transition: 'transform 0.1s linear',
        }}
      />

      {/* Orbe 3 – Azul claro (centro derecha) */}
      <div
        ref={orb3}
        className="absolute will-change-transform"
        style={{
          width: '45vw',
          height: '45vw',
          top: '30%',
          right: '10%',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 50% 50%, rgba(0,75,147,0.10) 0%, rgba(0,75,147,0.04) 60%, transparent 80%)',
          filter: 'blur(35px)',
          transition: 'transform 0.1s linear',
        }}
      />

      {/* Textura sutil de ruido para profundidad */}
      <div className="absolute inset-0" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '180px',
        opacity: 0.5,
      }} />
    </div>
  );
}

// ── Main Layout ────────────────────────────────────────────────────────────
export default function Layout({ children }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
 
  const navItems = [
    { path: '/dashboard', label: 'Panel', icon: LayoutDashboard },
    { path: '/directorio', label: 'Directorio', icon: BadgeCheck },
    { path: '/aprobaciones', label: 'Aprobaciones', icon: UserCheck, badge: pendingCount },
    { path: '/qr', label: 'Generar QR', icon: QrCode },
    { path: '/reportes', label: 'Reportes', icon: BarChart3 },
    { path: '/configuracion', label: 'Configuración', icon: Settings },
  ];

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const fetchCounts = async () => {
      try {
        const res = await fetch('/api/asistencias');
        const data = await res.json();
        setUnreadCount(data.filter(a => a.fecha === today).length);
      } catch { /* ignore */ }

      try {
        const res = await fetch('/api/usuarios');
        const data = await res.json();
        const pending = data.filter(u => u.rol === 'usuario' && !u.aprobado).length;
        setPendingCount(pending);
      } catch { /* ignore */ }
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close sidebar when route changes on mobile
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  return (
    <div className="flex min-h-screen" style={{ position: 'relative' }}>
      {/* Fondo animado con parallax */}
      <ParallaxBackground />

      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar (desktop: always visible | mobile: drawer) ── */}
      <aside className={clsx(
        'fixed left-0 top-0 h-screen w-64 flex flex-col z-50 transition-transform duration-300 no-print',
        'md:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )} style={{
        background: 'rgba(18, 20, 26, 0.92)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '6px 0 40px rgba(0,0,0,0.35)',
      }}>
        {/* Sidebar brand */}
        <div className="px-6 pt-7 pb-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <CorpoelecLogo size={30} variant="white" />
              <span className="text-base font-black text-white headline-font tracking-tighter">CORPOELEC</span>
            </div>
            <button className="md:hidden p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors" onClick={() => setSidebarOpen(false)}>
              <X size={18} />
            </button>
          </div>
          {/* Divider con etiqueta */}
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/30">Sistema de Asistencia</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-1 px-3 pt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  'group flex items-center gap-3.5 py-3 px-4 rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-white/10 text-white font-bold shadow-inner'
                    : 'text-white/50 hover:text-white/90 hover:bg-white/[0.06] font-semibold'
                )}
              >
                {/* Indicador activo */}
                <div className={clsx(
                  'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200',
                  isActive
                    ? 'bg-[#b5000b] shadow-[0_4px_12px_rgba(181,0,11,0.4)]'
                    : 'bg-white/[0.06] group-hover:bg-white/10'
                )}>
                  <Icon size={16} className={isActive ? 'text-white' : 'text-white/60 group-hover:text-white/80'} />
                </div>
                <span className="text-sm tracking-tight">{item.label}</span>
                {/* Badge de conteo si existe */}
                {item.badge > 0 && (
                  <span className="ml-auto bg-[#b5000b] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-pulse">
                    {item.badge}
                  </span>
                )}
                {/* Dot activo a la derecha */}
                {isActive && !item.badge && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#b5000b] shadow-[0_0_6px_rgba(181,0,11,0.8)]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="px-3 pb-6 mt-auto">
          {/* Divider */}
          <div className="h-px bg-white/10 mb-4" />
          <div className="rounded-xl p-3.5 flex items-center gap-3" style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            {user?.foto_perfil ? (
              <img
                src={user.foto_perfil}
                alt="Foto de perfil"
                className="w-9 h-9 rounded-full object-cover flex-shrink-0 border-2 border-white/20"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#b5000b]/80 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-[0_0_14px_rgba(181,0,11,0.35)]">
                {user?.nombres?.charAt(0)}{user?.apellidos?.charAt(0)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white/90 truncate">{user?.nombres} {user?.apellidos}</p>
              <p className="text-[10px] text-white/40 font-medium truncate">@{user?.usuario}</p>
            </div>
            <button
              onClick={logout}
              title="Cerrar sesión"
              className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Top Header ── */}
      <header className="fixed top-0 left-0 md:left-64 right-0 z-40 bg-transparent no-print transition-all duration-300 pointer-events-none">
        <div className="m-4 bg-gradient-to-r from-[#e30613] to-[#c5050f] text-white shadow-[0_10px_30px_rgba(227,6,19,0.16)] border border-[#b0040b]/30 rounded-2xl flex justify-between items-center px-5 py-3 pointer-events-auto">
          <div className="flex items-center gap-3">
            {/* Hamburger (mobile only) */}
            <button
              className="md:hidden p-2 rounded-xl hover:bg-white/10 transition-colors text-white mr-1"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            
            {/* Logo & Brand (Mobile only, hidden on desktop since sidebar has it) */}
            <div className="flex items-center gap-2 md:hidden">
              <CorpoelecLogo size={28} variant="white" />
              <span className="text-base font-black text-white tracking-tighter headline-font">CORPOELEC</span>
            </div>

            {/* Title - Clean, prominent, and not covered by the sidebar! */}
            <div className="hidden md:flex items-center gap-2.5">
              <span className="text-base font-black text-white tracking-tight headline-font">
                Asistencia Digital
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15 text-[10px] font-bold uppercase tracking-wider border border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                En Línea
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(v => !v)}
                className="relative p-2 text-white/90 hover:text-white transition-colors rounded-xl hover:bg-white/10"
                title="Notificaciones"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-white text-[#e30613] text-[9px] font-black rounded-full flex items-center justify-center shadow-sm">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && <NotificationsPanel onClose={() => setNotifOpen(false)} />}
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex flex-col items-end leading-tight mr-1">
                <span className="text-xs font-bold text-white">{user?.nombres} {user?.apellidos}</span>
                <span className="text-[9px] text-white/80 font-bold uppercase tracking-wider">@{user?.usuario}</span>
              </div>
              {user?.foto_perfil ? (
                <img
                  src={user.foto_perfil}
                  alt="Foto de perfil"
                  className="w-8 h-8 rounded-full object-cover border-2 border-white/30"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xs border border-white/30">
                  {user?.nombres?.charAt(0)}{user?.apellidos?.charAt(0)}
                </div>
              )}
              <button
                onClick={logout}
                title="Cerrar sesión"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all font-bold text-xs border border-white/15 shadow-sm"
              >
                <LogOut size={12} />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="w-full min-h-screen md:ml-64 px-4 sm:px-8 lg:px-12 pt-24 pb-24 md:pb-8 animate-fade-in" style={{ position: 'relative', zIndex: 1 }}>
        <div className="max-w-7xl mx-auto py-6">
          {children || <Outlet />}
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
                <div className="relative">
                  <div className={clsx('p-1.5 rounded-xl transition-all', isActive && 'bg-primary/10')}>
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  {item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#b5000b] text-white text-[8px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-md animate-pulse">
                      {item.badge}
                    </span>
                  )}
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
