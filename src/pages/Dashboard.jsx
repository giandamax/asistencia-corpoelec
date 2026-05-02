import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function Dashboard() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl sm:text-6xl font-black text-on-surface headline-font tracking-tighter mb-2 leading-none">
          Panel de <span className="text-primary-container">Control</span>
        </h1>
        <p className="text-on-surface-variant font-body text-base sm:text-lg max-w-md">
          Sistema integral de gestión de asistencia digital y terminal de seguridad.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-8">
        <Link
          to="/reportes"
          className="bg-surface-container-low p-8 rounded-3xl block hover:bg-surface-container-highest transition-colors"
        >
          <h5 className="text-xs font-black uppercase tracking-widest text-primary mb-6">
            Registro de Asistencia
          </h5>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-2 h-10 bg-primary rounded-full"></div>
            <p className="text-on-surface font-bold text-lg leading-tight">
              Acceso rápido a los registros de asistencia del personal.
            </p>
          </div>
          <div className="text-on-surface-variant text-xs font-bold flex items-center gap-2 mt-4">
            VER REPORTES <ArrowRight size={16} />
          </div>
        </Link>
      </div>
    </>
  );
}
