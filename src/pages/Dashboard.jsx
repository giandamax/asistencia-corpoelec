import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, QrCode, BarChart3, ChevronRight, 
  CheckCircle2, Clock, ShieldAlert, Award
} from 'lucide-react';
import CorpoelecLogo from '../components/CorpoelecLogo';
 
// Insignia oficial de CORPOELEC ACTIVA
function CorpoelecActivaBadge({ className = "" }) {
  return (
    <div className={`flex flex-col items-center justify-center p-6 bg-white rounded-3xl border border-slate-100 shadow-[0_15px_40px_rgba(0,0,0,0.02)] select-none ${className}`}>
      {/* Logo superior */}
      <CorpoelecLogo size={32} showText={true} className="scale-90 mb-3" />
      
      {/* Burbuja / Bocadillo "ACTIVA" con rayo */}
      <div className="relative bg-[#e30613] text-white px-8 py-2.5 rounded-2xl shadow-[0_8px_20px_rgba(227,6,19,0.3)] animate-pulse-slow">
        <span className="font-black text-lg tracking-widest block font-sans">ACTIVA</span>
        
        {/* Cola de la burbuja (Rayo) */}
        <div className="absolute -bottom-2 left-6 w-0 h-0 border-t-[10px] border-t-[#e30613] border-r-[10px] border-r-transparent"></div>
        <div className="absolute -bottom-3 left-4 text-[#e30613] text-xs font-black">⚡</div>
      </div>
    </div>
  );
}
 
export default function Dashboard() {
  const [stats, setStats] = useState({ empleados: 0, asistenciasHoy: 0 });
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [bgIndex, setBgIndex] = useState(0);
 
  const BANNERS = [
    '/dashboard-bg-1.jpg',
    '/dashboard-bg-2.jpg',
    '/dashboard-bg-3.jpg',
    '/dashboard-bg-4.jpg'
  ];

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const bgTimer = setInterval(() => setBgIndex(prev => (prev + 1) % BANNERS.length), 5000);
    return () => {
      clearInterval(timer);
      clearInterval(bgTimer);
    };
  }, [BANNERS.length]);
 
  const formatHoraNormal = (date) => {
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    return `${hours}:${minutes} ${ampm}`;
  };
 
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const resUsers = await fetch('/api/usuarios');
        const users = await resUsers.json();
        
        const resAsis = await fetch('/api/asistencias');
        const asis = await resAsis.json();
        
        const today = new Date().toISOString().split('T')[0];
        const todayAsis = asis.filter(a => a.fecha === today).length;
        
        setStats({
          empleados: users.length,
          asistenciasHoy: todayAsis
        });
      } catch (_) {
        // Silently ignore
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);
 
  return (
    <div className="space-y-8 max-w-6xl mx-auto relative">
      {/* Banner de Bienvenida con Slideshow de Fotos Reales */}
      <div className="relative overflow-hidden rounded-[2.5rem] p-8 md:p-12 text-white shadow-[0_20px_50px_rgba(0,43,103,0.3)] flex flex-col md:flex-row items-center justify-between gap-8 min-h-[340px]">
        
        {/* Slideshow Images */}
        {BANNERS.map((img, i) => (
          <div
            key={img}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${i === bgIndex ? 'opacity-100' : 'opacity-0'}`}
            style={{ backgroundImage: `url(${img})` }}
          />
        ))}

        {/* Gradiente Oscuro para Legibilidad */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#001026]/95 via-[#002b67]/80 to-[#e30613]/20 pointer-events-none" />
        <div className="absolute inset-0 bg-black/20 pointer-events-none" />
 
        <div className="relative space-y-4 max-w-lg z-10 drop-shadow-lg">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider border border-white/20 backdrop-blur-md">
            ⚡ Sistema Pulso Eléctrico
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight headline-font">
            Panel de Control de Asistencia
          </h1>
          <p className="text-white/90 font-medium text-sm sm:text-base leading-relaxed drop-shadow-md">
            Gestión en tiempo real de accesos, credenciales inteligentes y reportes de asistencia para el personal de CORPOELEC.
          </p>
        </div>
 
        {/* Insignia Corpoelec Activa integrada en el Banner */}
        <CorpoelecActivaBadge className="z-10 scale-100 md:scale-105 shadow-[0_20px_40px_rgba(0,0,0,0.4)]" />
      </div>
 
      {/* Grid de Estadísticas Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-[#002b67]/5 text-[#002b67] flex items-center justify-center flex-shrink-0">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Personal</p>
            <p className="text-3xl font-black text-slate-800 headline-font mt-1">
              {loading ? '...' : stats.empleados}
            </p>
          </div>
        </div>
 
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-green-500/5 text-green-600 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Asistencias Hoy</p>
            <p className="text-3xl font-black text-slate-800 headline-font mt-1">
              {loading ? '...' : stats.asistenciasHoy}
            </p>
          </div>
        </div>
 
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-[#e30613]/5 text-[#e30613] flex items-center justify-center flex-shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hora del Servidor</p>
            <p className="text-2xl font-black text-slate-800 headline-font mt-1.5 font-mono">
              {formatHoraNormal(currentTime)}
            </p>
          </div>
        </div>
      </div>
 
      {/* Sección de Accesos Rápidos Estilizados */}
      <div>
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 pl-2">Accesos del Sistema</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Lector de Reportes / Asistencias */}
          <Link
            to="/reportes"
            className="group bg-white hover:bg-slate-50/50 p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[160px]"
          >
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-xl bg-[#e30613]/10 text-[#e30613] flex items-center justify-center">
                <BarChart3 size={20} />
              </div>
              <ChevronRight size={18} className="text-slate-300 group-hover:text-primary transition-transform group-hover:translate-x-1" />
            </div>
            <div className="mt-4">
              <h4 className="font-black text-slate-800 text-lg">Registro de Asistencias</h4>
              <p className="text-slate-400 text-xs mt-1 font-medium">Visualice el historial en tiempo real, filtre e imprima reportes oficiales.</p>
            </div>
          </Link>
 
          {/* Directorio de Personal */}
          <Link
            to="/directorio"
            className="group bg-white hover:bg-slate-50/50 p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[160px]"
          >
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Users size={20} />
              </div>
              <ChevronRight size={18} className="text-slate-300 group-hover:text-primary transition-transform group-hover:translate-x-1" />
            </div>
            <div className="mt-4">
              <h4 className="font-black text-slate-800 text-lg">Directorio de Empleados</h4>
              <p className="text-slate-400 text-xs mt-1 font-medium">Gestione el personal registrado, modifique datos o añada nuevos ingresos.</p>
            </div>
          </Link>
 
          {/* Generador de QR */}
          <Link
            to="/qr"
            className="group bg-white hover:bg-slate-50/50 p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[160px]"
          >
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-xl bg-[#fbc02d]/10 text-[#fbc02d] flex items-center justify-center">
                <QrCode size={20} />
              </div>
              <ChevronRight size={18} className="text-slate-300 group-hover:text-primary transition-transform group-hover:translate-x-1" />
            </div>
            <div className="mt-4">
              <h4 className="font-black text-slate-800 text-lg">Generador de Credenciales QR</h4>
              <p className="text-slate-400 text-xs mt-1 font-medium">Consulte y genere el código QR identificador único de cada empleado.</p>
            </div>
          </Link>
 
          {/* Información Institucional */}
          <div className="bg-slate-50/60 p-6 rounded-3xl border border-slate-100 flex flex-col justify-between min-h-[160px]">
            <div className="w-10 h-10 rounded-xl bg-[#002b67]/10 text-[#002b67] flex items-center justify-center">
              <Award size={20} />
            </div>
            <div className="mt-4">
              <h4 className="font-black text-slate-800 text-sm">Corporación Eléctrica Nacional S.A.</h4>
              <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed font-medium">
                Este sistema cumple con los lineamientos de la Dirección General de Tecnología de Información y Comunicaciones para la modernización de los procesos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
