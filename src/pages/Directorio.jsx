import { useState, useEffect, useRef } from 'react';
import { Search, UserPlus, X, QrCode, Trash2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAlert } from '../components/AlertProvider';
import clsx from 'clsx';

export default function Directorio() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);
  const { showAlert } = useAlert();
  const navigate = useNavigate();

  // Filtered list based on search term
  const filteredUsuarios = usuarios.filter((u) => {
    const term = searchTerm.toLowerCase();
    return (
      u.nombres.toLowerCase().includes(term) ||
      u.apellidos.toLowerCase().includes(term) ||
      u.cedula_identidad.toLowerCase().includes(term) ||
      u.usuario.toLowerCase().includes(term)
    );
  });

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
        e.target.reset();
        fetchUsuarios();
      } else {
        showAlert(result.message, 'error');
      }
    } catch (err) {
      showAlert('Error de conexión al servidor', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/usuarios?id=${deleteTarget.id}`, { method: 'DELETE' });
      const result = await res.json();
      if (res.ok) {
        showAlert(result.message, 'success');
        setDeleteTarget(null);
        fetchUsuarios();
      } else {
        showAlert(result.message, 'error');
      }
    } catch (err) {
      showAlert('Error de conexión al servidor', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-5xl font-black text-on-surface headline-font tracking-tighter mb-2 leading-none">
            Directorio de <span className="text-primary-container">Empleados</span>
          </h1>
          <p className="text-on-surface-variant font-body text-base max-w-md">
            Base de datos integral del personal de Corpoelec.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search bar */}
          <div
            className={clsx(
              'flex items-center gap-2 bg-white border rounded-xl overflow-hidden transition-all duration-300 shadow-sm',
              searchOpen ? 'w-full sm:w-64 border-primary' : 'w-10 border-slate-200 cursor-pointer hover:border-primary/50'
            )}
            onClick={() => { if (!searchOpen) { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 50); } }}
          >
            <div className="pl-3 flex-shrink-0 text-on-surface-variant">
              <Search size={18} />
            </div>
            <input
              ref={searchRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onBlur={() => { if (!searchTerm) setSearchOpen(false); }}
              placeholder="Buscar por nombre, cédula..."
              className={clsx(
                'bg-transparent outline-none text-sm font-medium text-on-surface placeholder:text-slate-400 transition-all duration-300 py-3',
                searchOpen ? 'w-full pr-2' : 'w-0 p-0'
              )}
            />
            {searchOpen && searchTerm && (
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { setSearchTerm(''); searchRef.current?.focus(); }}
                className="pr-3 text-slate-400 hover:text-on-surface flex-shrink-0"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 sm:px-6 py-3 bg-primary text-white hover:bg-primary-container transition-all font-bold rounded-xl shadow-[0_10px_30px_rgba(181,0,11,0.2)] whitespace-nowrap text-sm"
          >
            <UserPlus size={16} />
            <span className="hidden sm:inline">Registrar Nuevo Empleado</span>
            <span className="sm:hidden">Nuevo</span>
          </button>
        </div>
      </div>

      {/* ── Desktop table ── */}
      <div className="hidden md:block bg-surface-container-lowest rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.02)]">
        <div className="grid grid-cols-12 bg-surface-dim/30 px-10 py-6">
          <div className="col-span-4 text-xs font-black text-on-surface-variant uppercase tracking-widest">Empleado</div>
          <div className="col-span-3 text-xs font-black text-on-surface-variant uppercase tracking-widest text-center">Cédula</div>
          <div className="col-span-3 text-xs font-black text-on-surface-variant uppercase tracking-widest">Usuario</div>
          <div className="col-span-2 text-xs font-black text-on-surface-variant uppercase tracking-widest text-right">Acciones</div>
        </div>
        <div className="flex flex-col">
          {loading ? (
            <div className="px-10 py-8 text-center text-slate-500 font-medium">Cargando...</div>
          ) : filteredUsuarios.length === 0 ? (
            <div className="px-10 py-12 text-center">
              <Search size={32} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 font-semibold">No se encontraron resultados{searchTerm && <> para <span className="text-primary">&ldquo;{searchTerm}&rdquo;</span></>}</p>
            </div>
          ) : (
            filteredUsuarios.map((u, index) => {
              const isEven = index % 2 === 0;
              const bgClass = isEven ? 'hover:bg-surface-container-low' : 'bg-surface-container-low/20 hover:bg-surface-container-low';
              const initials = u.nombres.charAt(0) + u.apellidos.charAt(0);
              return (
                <div key={u.id} className={clsx('grid grid-cols-12 items-center px-10 py-5 transition-colors border-b border-slate-50', bgClass)}>
                  <div className="col-span-4 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-base flex-shrink-0">{initials}</div>
                    <div>
                      <h4 className="text-on-surface font-bold headline-font text-base leading-tight">{u.nombres} {u.apellidos}</h4>
                      <p className="text-primary text-xs font-bold uppercase tracking-tighter">Activo</p>
                    </div>
                  </div>
                  <div className="col-span-3 text-center">
                    <span className="px-3 py-1.5 bg-surface-container-high rounded-full font-mono text-sm text-on-surface-variant font-bold">V-{u.cedula_identidad}</span>
                  </div>
                  <div className="col-span-3">
                    <p className="text-on-surface font-semibold text-sm truncate">{u.correo}</p>
                    <p className="text-on-surface-variant text-xs font-medium">@{u.usuario}</p>
                  </div>
                  <div className="col-span-2 flex justify-end gap-2">
                    <button onClick={() => navigate('/qr', { state: { userId: u.id } })} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary-container/20 text-on-secondary-container hover:bg-secondary-container transition-all font-semibold text-xs" title="Ver QR">
                      <QrCode size={14} /> Ver QR
                    </button>
                    <button onClick={() => setDeleteTarget(u)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all font-semibold text-xs" title="Eliminar">
                      <Trash2 size={14} /> Eliminar
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Mobile cards ── */}
      <div className="md:hidden flex flex-col gap-3">
        {loading ? (
          <div className="py-8 text-center text-slate-500 font-medium">Cargando...</div>
        ) : filteredUsuarios.length === 0 ? (
          <div className="py-12 text-center">
            <Search size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 font-semibold text-sm">No se encontraron resultados{searchTerm && <> para <span className="text-primary">&ldquo;{searchTerm}&rdquo;</span></>}</p>
          </div>
        ) : (
          filteredUsuarios.map((u) => {
            const initials = u.nombres.charAt(0) + u.apellidos.charAt(0);
            return (
              <div key={u.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">{initials}</div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-on-surface font-bold text-base leading-tight truncate">{u.nombres} {u.apellidos}</h4>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="font-mono text-xs text-on-surface-variant font-semibold">V-{u.cedula_identidad}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs text-on-surface-variant">@{u.usuario}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 px-2 py-1 rounded-full">Activo</span>
                </div>
                <p className="text-xs text-slate-400 truncate mb-3">{u.correo}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate('/qr', { state: { userId: u.id } })}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-secondary-container/20 text-on-secondary-container font-bold text-xs"
                  >
                    <QrCode size={14} /> Ver Código QR
                  </button>
                  <button
                    onClick={() => setDeleteTarget(u)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-50 text-red-600 font-bold text-xs"
                  >
                    <Trash2 size={14} /> Eliminar
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-on-background/40 backdrop-blur-sm animate-fade-in p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-10 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl sm:text-3xl font-black headline-font text-on-surface leading-none">Registrar Personal</h3>
                <p className="text-on-surface-variant mt-1 font-medium text-sm">Agregue un nuevo trabajador al sistema.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-surface-container-low rounded-full transition-colors text-slate-500">
                <X size={22} />
              </button>
            </div>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-on-surface-variant uppercase tracking-widest">Nombres</label>
                  <input name="nombres" required className="w-full px-4 py-3 bg-surface-container-low border-0 border-b-2 border-transparent focus:border-primary focus:ring-0 rounded-xl font-medium outline-none text-on-surface" placeholder="Ej: Juan" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-on-surface-variant uppercase tracking-widest">Apellidos</label>
                  <input name="apellidos" required className="w-full px-4 py-3 bg-surface-container-low border-0 border-b-2 border-transparent focus:border-primary focus:ring-0 rounded-xl font-medium outline-none text-on-surface" placeholder="Ej: Pérez" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-on-surface-variant uppercase tracking-widest">Cédula (ID)</label>
                  <input name="cedula_identidad" required className="w-full px-4 py-3 bg-surface-container-low border-0 border-b-2 border-transparent focus:border-primary focus:ring-0 rounded-xl font-medium outline-none text-on-surface" placeholder="V-00000000" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-on-surface-variant uppercase tracking-widest">Correo Electrónico</label>
                  <input name="correo" type="email" required className="w-full px-4 py-3 bg-surface-container-low border-0 border-b-2 border-transparent focus:border-primary focus:ring-0 rounded-xl font-medium outline-none text-on-surface" placeholder="correo@corpoelec.gob.ve" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-on-surface-variant uppercase tracking-widest">Usuario</label>
                  <input name="usuario" required className="w-full px-4 py-3 bg-surface-container-low border-0 border-b-2 border-transparent focus:border-primary focus:ring-0 rounded-xl font-medium outline-none text-on-surface" placeholder="jperez" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-on-surface-variant uppercase tracking-widest">Contraseña</label>
                  <input name="password" type="password" required className="w-full px-4 py-3 bg-surface-container-low border-0 border-b-2 border-transparent focus:border-primary focus:ring-0 rounded-xl font-medium outline-none text-on-surface" placeholder="••••••••" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-3.5 bg-surface-container-high text-on-surface font-bold rounded-xl hover:bg-slate-300 transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 px-6 py-3.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/30 hover:bg-primary-container transition-colors">
                  Registrar Empleado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-background/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} className="text-red-500" />
            </div>
            <h3 className="text-2xl font-black headline-font text-on-surface mb-2">¿Eliminar empleado?</h3>
            <p className="text-on-surface-variant font-medium mb-1">
              Esta acción eliminará permanentemente a:
            </p>
            <p className="text-on-surface font-black text-lg mb-2">
              {deleteTarget.nombres} {deleteTarget.apellidos}
            </p>
            <p className="text-red-500 text-sm font-semibold mb-8">
              También se eliminarán todos sus registros de asistencia y su código QR.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 px-6 py-4 bg-surface-container-high text-on-surface font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 px-6 py-4 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-200 disabled:opacity-60"
              >
                {deleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
