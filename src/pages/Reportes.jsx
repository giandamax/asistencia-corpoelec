import { useState, useEffect, useRef } from 'react';
import { Printer, X, QrCode, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { useAlert } from '../components/AlertProvider';
import { useSearchParams } from 'react-router-dom';
import clsx from 'clsx';

export default function Reportes() {
  const [asistencias, setAsistencias] = useState([]);
  const [filterDate, setFilterDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [empleadoInfo, setEmpleadoInfo] = useState(null);
  const [registroStatus, setRegistroStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [registroMsg, setRegistroMsg] = useState('');
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearing, setClearing] = useState(false);
  const { showAlert } = useAlert();
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightedRowRef = useRef(null);
  const registroHecho = useRef(false); // evita doble registro en React StrictMode

  // Read ?empleado=ID and ?token=USER_X_CEDULA from URL (set by QR scan)
  const empleadoId = searchParams.get('empleado');
  const token = searchParams.get('token');

  // ── Fetch employee name/cedula info ────────────────────────────────────────
  useEffect(() => {
    if (!empleadoId) {
      setEmpleadoInfo(null);
      return;
    }
    const fetchEmpleado = async () => {
      try {
        const res = await fetch('/api/usuarios');
        const data = await res.json();
        const found = data.find(u => String(u.id) === String(empleadoId));
        if (found) {
          setEmpleadoInfo({
            id: found.id,
            nombre: `${found.nombres} ${found.apellidos}`,
            cedula: found.cedula_identidad,
          });
        }
      } catch (_) {
        // silently ignore
      }
    };
    fetchEmpleado();
  }, [empleadoId]);

  // ── Auto-register attendance when QR token is present ─────────────────────
  useEffect(() => {
    if (!token || registroHecho.current) return;
    registroHecho.current = true;

    const registrar = async () => {
      setRegistroStatus('loading');
      setRegistroMsg('Registrando asistencia...');
      try {
        const res = await fetch('/api/asistencias', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qr_data: decodeURIComponent(token) }),
        });
        const result = await res.json();
        if (res.ok) {
          setRegistroStatus('success');
          setRegistroMsg(result.message || 'Asistencia registrada correctamente.');
          // Reload list so the new record appears immediately
          fetchAsistencias();
        } else {
          setRegistroStatus('error');
          setRegistroMsg(result.message || 'Error al registrar asistencia.');
        }
      } catch (_) {
        setRegistroStatus('error');
        setRegistroMsg('Error de conexión con el servidor.');
      }
    };
    registrar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ── Scroll highlighted row into view ──────────────────────────────────────
  useEffect(() => {
    if (highlightedRowRef.current) {
      highlightedRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [asistencias, empleadoId]);

  // ── Fetch attendance list ──────────────────────────────────────────────────
  const fetchAsistencias = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/asistencias');
      let data = await res.json();
      if (filterDate) {
        data = data.filter(a => a.fecha === filterDate);
      }
      setAsistencias(data);
    } catch (err) {
      showAlert('Error cargando asistencias', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Initial load + filter change
  useEffect(() => {
    fetchAsistencias();
  }, [filterDate]);

  // ── Auto-polling every 15s so the PC sees new scans in real time ───────────
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAsistencias();
    }, 15000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterDate]);

  const clearEmpleadoFilter = () => {
    setSearchParams({});
    setEmpleadoInfo(null);
    setRegistroStatus(null);
    setRegistroMsg('');
    registroHecho.current = false;
  };

  // ── Print ─────────────────────────────────────────────────────────────────
  const handlePrint = () => window.print();

  // ── Clear all attendance records ──────────────────────────────────────────
  const handleClearRecords = async () => {
    setClearing(true);
    try {
      const url = filterDate
        ? `/api/asistencias?fecha=${filterDate}`
        : '/api/asistencias';
      const res = await fetch(url, { method: 'DELETE' });
      if (res.ok) {
        const result = await res.json().catch(() => ({}));
        showAlert(result.message || 'Registros eliminados correctamente.', 'success');
        setShowClearModal(false);
        // Limpiar directamente sin pasar por setLoading(true) para no dejar pantalla en blanco
        setAsistencias([]);
      } else {
        const data = await res.json().catch(() => ({}));
        showAlert(data.message || `Error del servidor (${res.status})`, 'error');
      }
    } catch (_) {
      showAlert('Error de conexión. ¿Está corriendo el backend?', 'error');
    } finally {
      setClearing(false);
    }
  };


  const rowsToRender = asistencias;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 no-print">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black text-on-surface headline-font tracking-tighter leading-none">
            Registro de <span className="text-primary-container">Asistencias</span>
          </h1>
          <p className="text-on-surface-variant font-body text-base mt-1">Histórico consolidado de entradas del personal.</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-600 shadow-sm focus:ring-2 focus:ring-primary outline-none text-sm"
          />
          {asistencias.length > 0 && (
            <button
              onClick={() => setShowClearModal(true)}
              className="px-4 py-2.5 bg-surface-container-highest text-on-surface hover:bg-red-50 hover:text-red-700 hover:border-red-200 border border-slate-200 transition-all font-bold rounded-xl flex items-center gap-2 text-sm"
              title="Eliminar los registros de asistencia mostrados actualmente"
            >
              <Trash2 size={16} /> <span className="hidden sm:inline">Borrar Registros</span><span className="sm:hidden">Borrar</span>
            </button>
          )}
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-primary text-white hover:bg-primary-container transition-all font-bold rounded-xl shadow-[0_4px_14px_rgba(181,0,11,0.3)] flex items-center gap-2 text-sm"
            title="Imprimir el reporte de asistencia actual"
          >
            <Printer size={16} /> <span className="hidden sm:inline">Imprimir Reporte</span><span className="sm:hidden">Imprimir</span>
          </button>
        </div>
      </div>

      {/* QR Scan Banner */}
      {empleadoId && (
        <div className={clsx(
          'mb-6 no-print flex items-center gap-4 px-6 py-4 rounded-2xl animate-fade-in border',
          registroStatus === 'success' ? 'bg-green-50 border-green-200' :
          registroStatus === 'error'   ? 'bg-red-50 border-red-200' :
                                         'bg-primary/5 border-primary/20'
        )}>
          <div className={clsx(
            'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
            registroStatus === 'success' ? 'bg-green-100 text-green-600' :
            registroStatus === 'error'   ? 'bg-red-100 text-red-600' :
                                           'bg-primary/10 text-primary'
          )}>
            {registroStatus === 'success' ? <CheckCircle size={20} /> :
             registroStatus === 'error'   ? <AlertCircle size={20} /> :
                                            <QrCode size={20} />}
          </div>
          <div className="flex-1 min-w-0">
            <p className={clsx(
              'text-xs font-black uppercase tracking-widest mb-0.5',
              registroStatus === 'success' ? 'text-green-700' :
              registroStatus === 'error'   ? 'text-red-700' : 'text-primary'
            )}>
              {registroStatus === 'success' ? 'Asistencia Registrada' :
               registroStatus === 'error'   ? 'Error de Registro' :
               registroStatus === 'loading' ? 'Procesando...' : 'QR Escaneado'}
            </p>
            <p className="text-on-surface font-bold text-base leading-tight truncate">
              {empleadoInfo ? empleadoInfo.nombre : `Empleado #${empleadoId}`}
              {empleadoInfo && (
                <span className="ml-2 font-mono text-sm text-on-surface-variant font-normal">
                  V-{empleadoInfo.cedula}
                </span>
              )}
            </p>
            {registroMsg && (
              <p className={clsx(
                'text-xs mt-0.5 font-medium',
                registroStatus === 'success' ? 'text-green-600' :
                registroStatus === 'error'   ? 'text-red-600' : 'text-slate-500'
              )}>{registroMsg}</p>
            )}
          </div>
          <button
            onClick={clearEmpleadoFilter}
            className="p-2 rounded-full hover:bg-surface-container-low transition-colors text-slate-400 hover:text-slate-700 flex-shrink-0"
            title="Limpiar filtro"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Print Header */}
      <div className="hidden print:block text-center mb-8">
        <h2 className="text-2xl font-black text-[#b5000b] headline-font">⚡ CORPOELEC</h2>
        <h3 className="text-xl font-bold text-slate-800">Reporte de Asistencia Diario</h3>
        {filterDate && <p className="text-slate-600">Fecha: {filterDate}</p>}
        {empleadoInfo && <p className="text-slate-600">Empleado: {empleadoInfo.nombre}</p>}
      </div>

      {/* ── Desktop table ── */}
      <div className="hidden md:block bg-surface-container-lowest rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.02)] border border-slate-100 print:shadow-none print:border-black print:rounded-none">
        <div className="grid grid-cols-12 bg-surface-dim/30 px-10 py-6 print:bg-[#b5000b] print:text-white">
          <div className="col-span-4 text-xs font-black text-on-surface-variant uppercase tracking-widest print:text-white">Empleado</div>
          <div className="col-span-2 text-xs font-black text-on-surface-variant uppercase tracking-widest text-center print:text-white">Cédula</div>
          <div className="col-span-2 text-xs font-black text-on-surface-variant uppercase tracking-widest text-center print:text-white">Fecha</div>
          <div className="col-span-2 text-xs font-black text-on-surface-variant uppercase tracking-widest text-center print:text-white">Hora</div>
          <div className="col-span-2 text-xs font-black text-on-surface-variant uppercase tracking-widest text-right print:text-white">Método</div>
        </div>
        <div className="flex flex-col">
          {loading ? (
            <div className="px-10 py-8 text-center text-slate-500 font-medium">Cargando...</div>
          ) : rowsToRender.length === 0 ? (
            <div className="px-10 py-8 text-center text-slate-500 font-medium">No hay registros de asistencia.</div>
          ) : (
            rowsToRender.map((a, index) => {
              const isEven = index % 2 === 0;
              const isHighlighted = empleadoId && String(a.usuario_id ?? a.id_usuario ?? a.cedula) === String(empleadoId)
                || (empleadoInfo && `${a.nombres} ${a.apellidos}` === empleadoInfo.nombre);
              const bgClass = isHighlighted
                ? 'bg-primary/5 border-l-4 border-l-primary ring-1 ring-inset ring-primary/10'
                : isEven ? 'hover:bg-surface-container-low' : 'bg-surface-container-low/20 hover:bg-surface-container-low';
              const initials = a.nombres.charAt(0) + a.apellidos.charAt(0);
              return (
                <div
                  key={index}
                  ref={isHighlighted ? highlightedRowRef : null}
                  className={clsx('grid grid-cols-12 items-center px-10 py-5 transition-all duration-500 border-b border-slate-50 print:border-b-black print:py-2', bgClass, isHighlighted && 'animate-pulse-once')}
                >
                  <div className="col-span-4 flex items-center gap-3">
                    <div className={clsx('w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 print:border print:border-black', isHighlighted ? 'bg-primary text-white' : 'bg-tertiary-container/20 text-tertiary')}>{initials}</div>
                    <div>
                      <h4 className={clsx('font-bold headline-font text-sm leading-tight print:text-black', isHighlighted ? 'text-primary' : 'text-on-surface')}>
                        {a.nombres} {a.apellidos}
                        {isHighlighted && <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-primary text-white px-2 py-0.5 rounded-full"><QrCode size={10} /> Escaneado</span>}
                      </h4>
                    </div>
                  </div>
                  <div className="col-span-2 text-center"><span className="px-2 py-1 bg-surface-container-high rounded-full font-mono text-xs text-on-surface-variant font-bold print:border print:border-black print:bg-transparent print:text-black">V-{a.cedula}</span></div>
                  <div className="col-span-2 text-center"><p className="text-on-surface font-semibold text-sm print:text-black">{a.fecha}</p></div>
                  <div className="col-span-2 text-center"><p className="text-on-surface font-semibold text-sm print:text-black">{a.hora}</p></div>
                  <div className="col-span-2 text-right"><span className="text-xs font-bold uppercase tracking-wider text-primary print:text-black">{a.metodo}</span></div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Mobile cards ── */}
      <div className="md:hidden flex flex-col gap-3">
        {loading ? (
          <div className="py-8 text-center text-slate-500 text-sm">Cargando...</div>
        ) : rowsToRender.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-sm">No hay registros de asistencia.</div>
        ) : (
          rowsToRender.map((a, index) => {
            const isHighlighted = empleadoId && String(a.cedula) === String(empleadoId)
              || (empleadoInfo && `${a.nombres} ${a.apellidos}` === empleadoInfo.nombre);
            const initials = a.nombres.charAt(0) + a.apellidos.charAt(0);
            return (
              <div
                key={index}
                ref={isHighlighted ? highlightedRowRef : null}
                className={clsx('bg-white rounded-2xl p-4 border shadow-sm', isHighlighted ? 'border-primary/30 bg-primary/[0.02]' : 'border-slate-100')}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={clsx('w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0', isHighlighted ? 'bg-primary text-white' : 'bg-tertiary-container/20 text-tertiary')}>{initials}</div>
                  <div className="flex-1 min-w-0">
                    <p className={clsx('font-bold text-sm leading-tight truncate', isHighlighted ? 'text-primary' : 'text-on-surface')}>
                      {a.nombres} {a.apellidos}
                      {isHighlighted && <span className="ml-2 inline-flex items-center gap-1 text-[9px] font-black uppercase bg-primary text-white px-1.5 py-0.5 rounded-full"><QrCode size={8} /> Escaneado</span>}
                    </p>
                    <p className="text-xs font-mono text-on-surface-variant">V-{a.cedula}</p>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/5 px-2 py-1 rounded-full flex-shrink-0">{a.metodo}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 font-medium pl-13">
                  <span className="font-mono">{a.fecha}</span>
                  <span className="text-slate-300">·</span>
                  <span className="font-mono font-bold text-on-surface">{a.hora}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Clear Records Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 mx-4">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-5">
              <Trash2 size={28} className="text-red-600" />
            </div>
            <h3 className="text-2xl font-black headline-font text-on-surface mb-2">Limpiar Registros</h3>
            <p className="text-on-surface-variant font-medium mb-1">
              {filterDate
                ? <>Se eliminarán todos los registros del <strong className="text-on-surface">{filterDate}</strong>.</>  
                : 'Se eliminarán <strong>todos</strong> los registros de asistencia.'}
            </p>
            <p className="text-xs text-red-500 font-semibold mb-8">⚠️ Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearModal(false)}
                disabled={clearing}
                className="flex-1 px-6 py-3 bg-surface-container-high text-on-surface font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleClearRecords}
                disabled={clearing}
                className="flex-1 px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {clearing ? 'Eliminando...' : <><Trash2 size={18} /> Confirmar Limpieza</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
