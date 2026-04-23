import { Link, Outlet, useLocation } from 'react-router-dom';
import { Bell, Zap, LayoutDashboard, BadgeCheck, QrCode, BarChart3 } from 'lucide-react';
import clsx from 'clsx';

export default function Layout() {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Panel de Control', icon: LayoutDashboard },
    { path: '/directorio', label: 'Directorio', icon: BadgeCheck },
    { path: '/qr', label: 'Generar QR', icon: QrCode },
    { path: '/reportes', label: 'Reportes', icon: BarChart3 },
  ];

  return (
    <div className="flex pt-20">
      {/* TopNavBar */}
      <header className="fixed top-0 z-40 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-[0_20px_40px_rgba(181,0,11,0.04)] flex justify-between items-center px-8 py-4 no-print">
        <div className="flex items-center gap-4">
          <span className="text-2xl font-black text-primary tracking-tighter headline-font">CORPOELEC</span>
          <span className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tighter headline-font hidden sm:block border-l-2 border-slate-200 dark:border-slate-700 pl-4 ml-4">
            Asistencia Digital
          </span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 border-l pl-6 border-slate-200/50">
            <button className="text-tertiary hover:text-primary transition-colors">
              <Bell size={24} />
            </button>
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-surface-container-highest">
              <img
                alt="User profile avatar"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCDq4srDC27whZiuA1G4JswunDgCtHh-Wi9v00g_8YOsgbohKEyw9wmUJ4Q1vfbBxLtsCu4RNu6qx4yv2uxB55t7zGt6-KI923yPqaYAmFpnQUqwDr-ysJamrPuVTwHSy7_ZMrfWE11jrC0BCwgOT6SAtxHXHut4E1uSNf-vzb2yjlnUogDOzCxc2hQr6eL_zAg_Kg3KR2we2nlA3JJne9-2eQhGR2uHdsF01PTHanlyu6-C8qyFV9sV9-RwbVwFwXw1fx0kTT6Dfc"
              />
            </div>
          </div>
        </div>
      </header>

      {/* SideNavBar */}
      <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col py-8 gap-6 bg-slate-50 dark:bg-slate-950 border-r-0 z-30 pt-24 no-print">
        <div className="px-8 mb-8 flex flex-col gap-2">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-2">
            <Zap size={32} className="text-white" fill="currentColor" />
          </div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white headline-font leading-tight">
            Gestión de Asistencia
          </h2>
          <p className="text-xs font-['Public_Sans'] font-semibold text-primary uppercase tracking-wider">
            Sistema Pulso Eléctrico
          </p>
        </div>

        <nav className="flex-1 flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  "flex items-center gap-4 py-3 px-8 rounded-r-full mr-4 transition-all hover:translate-x-1",
                  isActive
                    ? "bg-slate-100 text-slate-900 font-bold border-l-4 border-primary"
                    : "text-slate-600 hover:bg-slate-100 font-semibold"
                )}
              >
                <Icon size={20} className={isActive ? "text-primary" : "text-slate-500"} />
                <span className="font-['Public_Sans'] text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>


      </aside>

      {/* Main Content Area */}
      <main className="ml-64 w-full min-h-screen bg-surface px-12 py-8 pt-24 animate-fade-in">
        <Outlet />
      </main>
    </div>
  );
}
