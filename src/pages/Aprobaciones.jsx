import { useState, useEffect } from 'react';
import { UserCheck, UserX, AlertCircle, Clock, Check } from 'lucide-react';
import { useAlert } from '../components/AlertProvider';

export default function Aprobaciones() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const { showAlert } = useAlert();

  const fetchUsuarios = async () => {
    try {
      const res = await fetch('/api/usuarios');
      const data = await res.json();
      // Filtrar usuarios pendientes (rol == 'usuario' y aprobado == false)
      const pendientes = data.filter(u => u.rol === 'usuario' && !u.aprobado);
      setUsuarios(pendientes);
    } catch {
      showAlert('Error cargando la lista de aprobaciones', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleAprobar = async (id, nombre) => {
    if (!window.confirm(`¿Aprobar el registro de ${nombre}?`)) return;
    setProcessingId(id);
    try {
      const res = await fetch('/api/aprobar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_id: id, aprobado: true }),
      });
      const data = await res.json();
      if (res.ok) {
        showAlert(`¡Usuario ${nombre} aprobado correctamente!`, 'success');
        fetchUsuarios();
      } else {
        showAlert(data.message || 'Error al aprobar usuario.', 'error');
      }
    } catch {
      showAlert('Error de conexión.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRechazar = async (id, nombre) => {
    if (!window.confirm(`¿Rechazar y eliminar el registro de ${nombre}? Esta acción no se puede deshacer.`)) return;
    setProcessingId(id);
    try {
      const res = await fetch(`/api/usuarios?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        showAlert(`Registro de ${nombre} rechazado y eliminado.`, 'success');
        fetchUsuarios();
      } else {
        showAlert(data.message || 'Error al rechazar usuario.', 'error');
      }
    } catch {
      showAlert('Error de conexión.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Cabecera */}
      <div>
        <h1 className="text-3xl sm:text-5xl font-black text-on-surface headline-font tracking-tighter mb-2 leading-none">
          Aprobación de <span className="text-primary-container">Usuarios</span>
        </h1>
        <p className="text-on-surface-variant font-body text-base max-w-md">
          Gestione y apruebe las solicitudes de registro para que los empleados puedan obtener su credencial QR.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span className="text-sm font-semibold text-on-surface-variant">Cargando solicitudes pendientes...</span>
        </div>
      ) : usuarios.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-12 text-center border border-slate-100 shadow-[0_15px_40px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center text-green-500 mb-4 border border-green-100">
            <Check size={28} strokeWidth={2.5} />
          </div>
          <h3 className="text-lg font-bold text-on-surface mb-1">¡Al día con las aprobaciones!</h3>
          <p className="text-slate-400 text-sm max-w-sm">
            No hay solicitudes de registro pendientes en este momento.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {usuarios.map((u) => {
            const initials = u.nombres.charAt(0) + u.apellidos.charAt(0);
            const isProcessing = processingId === u.id;
            return (
              <div
                key={u.id}
                className="bg-white rounded-3xl border border-slate-100 shadow-[0_10px_35px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-all duration-300 p-6 flex flex-col justify-between"
              >
                <div>
                  {/* Fila superior con Avatar e Info principal */}
                  <div className="flex items-center gap-4 mb-5">
                    {u.foto_perfil ? (
                      <img
                        src={u.foto_perfil}
                        alt="Foto de perfil"
                        className="w-12 h-12 rounded-2xl object-cover border-2 border-slate-100 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg flex-shrink-0">
                        {initials}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="font-bold text-on-surface truncate leading-snug">
                        {u.nombres} {u.apellidos}
                      </h4>
                      <p className="text-xs text-on-surface-variant font-medium truncate">
                        @{u.usuario}
                      </p>
                    </div>
                  </div>

                  {/* Campos de datos del usuario */}
                  <div className="space-y-2.5 bg-slate-50/50 rounded-2xl p-4 mb-6 border border-slate-100 text-xs font-semibold text-on-surface-variant">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Cédula:</span>
                      <span className="text-on-surface font-mono truncate">{u.cedula_identidad}</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Correo:</span>
                      <span className="text-on-surface truncate">{u.correo}</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Estado:</span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200">
                        <Clock size={10} /> Pendiente
                      </span>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleRechazar(u.id, `${u.nombres} ${u.apellidos}`)}
                    disabled={isProcessing}
                    className="py-3 px-4 border border-red-200 hover:border-red-500 hover:bg-red-50 text-red-600 hover:text-red-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <UserX size={14} /> Rechazar
                  </button>
                  <button
                    onClick={() => handleAprobar(u.id, `${u.nombres} ${u.apellidos}`)}
                    disabled={isProcessing}
                    className="py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-green-600/10 hover:shadow-lg hover:shadow-green-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <UserCheck size={14} /> Aprobar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
