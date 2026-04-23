import { useState, useEffect } from 'react';
import { Filter, UserPlus, X, QrCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAlert } from '../components/AlertProvider';
import clsx from 'clsx';

export default function Directorio() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showAlert } = useAlert();
  const navigate = useNavigate();

  const fetchUsuarios = async () => {
    try {
      const res = await fetch('/api/usuarios');
      const data = await res.json();
      setUsuarios(data);
    } catch (err) {
      showAlert('Error cargando directorio', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      
      if (res.ok) {
        showAlert(result.message, 'success');
        setIsModalOpen(false);
        fetchUsuarios();
      } else {
        showAlert(result.message, 'error');
      }
    } catch (err) {
      showAlert('Error de conexión al servidor', 'error');
    }
  };

  return (
    <>
      <div className="flex justify-between items-end mb-12">
        <div className="max-w-2xl">
          <h1 className="text-5xl font-black text-on-surface headline-font tracking-tighter mb-4 leading-none">
            Directorio de <span className="text-primary-container">Empleados</span>
          </h1>
          <p className="text-on-surface-variant font-body text-lg max-w-md">
            Base de datos integral del personal de Corpoelec y credenciales de seguridad.
          </p>
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-2 px-8 py-4 bg-surface-container-lowest text-on-surface border border-transparent hover:bg-surface-container-low transition-all font-bold rounded-xl shadow-sm">
            <Filter size={20} /> Filtros
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-8 py-4 bg-primary text-white hover:bg-primary-container transition-all font-bold rounded-xl shadow-[0_10px_30px_rgba(181,0,11,0.2)]"
          >
            <UserPlus size={20} /> Añadir Empleado
          </button>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.02)]">
        <div className="grid grid-cols-12 bg-surface-dim/30 px-10 py-6 border-b-0">
          <div className="col-span-4 text-xs font-black text-on-surface-variant uppercase tracking-widest">Empleado</div>
          <div className="col-span-3 text-xs font-black text-on-surface-variant uppercase tracking-widest text-center">Cédula</div>
          <div className="col-span-3 text-xs font-black text-on-surface-variant uppercase tracking-widest">Usuario</div>
          <div className="col-span-2 text-xs font-black text-on-surface-variant uppercase tracking-widest text-right">Acciones</div>
        </div>
        
        <div className="flex flex-col">
          {loading ? (
            <div className="px-10 py-8 text-center text-slate-500 font-medium">Cargando...</div>
          ) : usuarios.length === 0 ? (
            <div className="px-10 py-8 text-center text-slate-500 font-medium">No hay empleados registrados.</div>
          ) : (
            usuarios.map((u, index) => {
              const isEven = index % 2 === 0;
              const bgClass = isEven ? 'hover:bg-surface-container-low' : 'bg-surface-container-low/20 hover:bg-surface-container-low';
              const initials = u.nombres.charAt(0) + u.apellidos.charAt(0);

              return (
                <div key={u.id} className={clsx("grid grid-cols-12 items-center px-10 py-6 transition-colors group border-b border-slate-50", bgClass)}>
                  <div className="col-span-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                      {initials}
                    </div>
                    <div>
                      <h4 className="text-on-surface font-bold headline-font text-lg leading-tight">{u.nombres} {u.apellidos}</h4>
                      <p className="text-primary text-xs font-bold uppercase tracking-tighter">Activo</p>
                    </div>
                  </div>
                  <div className="col-span-3 text-center">
                    <span className="px-4 py-2 bg-surface-container-high rounded-full font-mono text-sm text-on-surface-variant font-bold">
                      V-{u.cedula_identidad}
                    </span>
                  </div>
                  <div className="col-span-3">
                    <p className="text-on-surface font-semibold text-sm">{u.correo}</p>
                    <p className="text-on-surface-variant text-xs font-medium">@{u.usuario}</p>
                  </div>
                  <div className="col-span-2 flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => navigate('/qr', { state: { userId: u.id } })}
                      className="w-10 h-10 rounded-lg flex items-center justify-center bg-secondary-container/20 text-on-secondary-container hover:bg-secondary-container transition-all"
                      title="Generar QR"
                    >
                      <QrCode size={20} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-background/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden p-10">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-3xl font-black headline-font text-on-surface leading-none">Registrar Personal</h3>
                <p className="text-on-surface-variant mt-2 font-medium">Agregue un nuevo trabajador al sistema.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-surface-container-low rounded-full transition-colors text-slate-500"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-on-surface-variant uppercase tracking-widest">Nombres</label>
                  <input name="nombres" required className="w-full px-6 py-4 bg-surface-container-low border-0 border-b-2 border-transparent focus:border-primary focus:ring-0 rounded-xl font-medium outline-none" placeholder="Ej: Juan" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-on-surface-variant uppercase tracking-widest">Apellidos</label>
                  <input name="apellidos" required className="w-full px-6 py-4 bg-surface-container-low border-0 border-b-2 border-transparent focus:border-primary focus:ring-0 rounded-xl font-medium outline-none" placeholder="Ej: Pérez" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-on-surface-variant uppercase tracking-widest">Cédula (ID)</label>
                  <input name="cedula_identidad" required className="w-full px-6 py-4 bg-surface-container-low border-0 border-b-2 border-transparent focus:border-primary focus:ring-0 rounded-xl font-medium outline-none" placeholder="V-00000000" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-on-surface-variant uppercase tracking-widest">Correo Electrónico</label>
                  <input name="correo" type="email" required className="w-full px-6 py-4 bg-surface-container-low border-0 border-b-2 border-transparent focus:border-primary focus:ring-0 rounded-xl font-medium outline-none" placeholder="correo@corpoelec.gob.ve" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-on-surface-variant uppercase tracking-widest">Usuario</label>
                  <input name="usuario" required className="w-full px-6 py-4 bg-surface-container-low border-0 border-b-2 border-transparent focus:border-primary focus:ring-0 rounded-xl font-medium outline-none" placeholder="jperez" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-on-surface-variant uppercase tracking-widest">Contraseña</label>
                  <input name="password" type="password" required className="w-full px-6 py-4 bg-surface-container-low border-0 border-b-2 border-transparent focus:border-primary focus:ring-0 rounded-xl font-medium outline-none" placeholder="••••••••" />
                </div>
              </div>
              
              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-8 py-4 bg-surface-container-high text-on-surface font-bold rounded-xl hover:bg-slate-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-8 py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/30 hover:bg-primary-container transition-colors"
                >
                  Registrar Empleado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
