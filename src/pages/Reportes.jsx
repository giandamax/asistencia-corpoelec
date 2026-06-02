import { useState, useEffect, useRef } from 'react';
import { Printer, X, QrCode, CheckCircle, AlertCircle, Trash2, ShieldCheck, ShieldX } from 'lucide-react';
import { useAlert } from '../components/AlertProvider';
import { useSearchParams } from 'react-router-dom';
import clsx from 'clsx';
import CorpoelecLogo from '../components/CorpoelecLogo';

export default function Reportes({ isPublic = false }) {
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

  // ── Verificación de identidad (solo vista pública) ─────────────────────────
  const [usuarioInput, setUsuarioInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verificado, setVerificado] = useState(false);
  const [verificacionError, setVerificacionError] = useState('');
  const [verificando, setVerificando] = useState(false);
  const usuarioRef = useRef(null);

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

  // ── Auto-register attendance when QR token is present (solo tras verificación) ─
  // La función de registro se llama manualmente tras verificar identidad
  const registrarAsistencia = async () => {
    if (registroHecho.current) return;
    registroHecho.current = true;
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

  // ── Verificar usuario + contraseña contra la API de login ──────────────────
  const handleVerificar = async (e) => {
    e.preventDefault();
    if (!usuarioInput.trim()) {
      setVerificacionError('Por favor ingresa tu nombre de usuario.');
      return;
    }
    if (!passwordInput.trim()) {
      setVerificacionError('Por favor ingresa tu contraseña.');
      return;
    }
    setVerificando(true);
    setVerificacionError('');

    try {
      // 1️⃣ Autenticar usuario con la API de login (usa campo 'usuario')
      const loginRes = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: usuarioInput.trim(), password: passwordInput }),
      });
      const loginData = await loginRes.json();

      if (!loginRes.ok) {
        setVerificacionError('❌ Usuario o contraseña incorrecta. Verifica tus datos e intenta de nuevo.');
        setVerificando(false);
        return;
      }

      // 2️⃣ Verificar que la persona autenticada sea el titular del QR
      const decodedToken = decodeURIComponent(token || '');
      const parts = decodedToken.split('_');
      // Formato token: USER_ID_CEDULA → parts[0]=USER, parts[1]=ID, parts[2]=CEDULA
      const cedulaEnQR = parts.length >= 3 ? parts.slice(2).join('_') : '';
      const userIdEnQR = parts.length >= 2 ? parts[1] : '';

      const cedulaUsuario = String(loginData.user?.cedula_identidad || '').trim().replace(/\D/g, '');
      const cedulaQRLimpia = String(cedulaEnQR).trim().replace(/\D/g, '');
      const idCoincide = String(loginData.user?.id) === String(userIdEnQR);
      const cedulaCoincide = cedulaUsuario === cedulaQRLimpia;

      if (!cedulaCoincide || !idCoincide) {
        setVerificacionError('🚫 Este código QR no te pertenece. Solo puedes registrar tu propia asistencia.');
        setVerificando(false);
        return;
      }

      // ✅ Todo correcto — registrar asistencia
      setVerificado(true);
      setVerificacionError('');
      await registrarAsistencia();
    } catch (_) {
      setVerificacionError('Error de conexión. Verifica tu internet e intenta de nuevo.');
    }
    setVerificando(false);
  };

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

  if (isPublic) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{
        background: 'linear-gradient(135deg, #001026 0%, #002b67 50%, #001840 100%)'
      }}>
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
          {/* Header rojo corporativo */}
          <div className="bg-[#b5000b] px-8 py-6 flex flex-col items-center gap-3">
            <div className="flex items-center gap-2.5">
              <CorpoelecLogo size={32} />
              <span className="text-xl font-black text-white headline-font tracking-tight">CORPOELEC</span>
            </div>
            <p className="text-white/80 text-xs font-semibold uppercase tracking-widest">Sistema de Control de Asistencia</p>
          </div>

          <div className="p-8 flex flex-col items-center">
            {/* PASO 1: Verificación de Identidad */}
            {!verificado && registroStatus !== 'success' && registroStatus !== 'error' ? (
              <>
                <div className="w-16 h-16 rounded-2xl bg-[#002b67]/10 flex items-center justify-center mb-5">
                  <ShieldCheck size={32} className="text-[#002b67]" />
                </div>
                <h2 className="text-xl font-black text-slate-800 headline-font text-center mb-1">
                  Verificación de Identidad
                </h2>
                <p className="text-slate-400 text-xs font-semibold text-center mb-2">
                  Para registrar tu asistencia, confirma tu identidad.
                </p>

                {empleadoInfo && (
                  <div className="w-full bg-slate-50 rounded-2xl p-4 mb-5 flex items-center gap-3 border border-slate-100">
                    <div className="w-10 h-10 rounded-full bg-[#002b67]/10 flex items-center justify-center font-bold text-[#002b67] text-sm flex-shrink-0">
                      {empleadoInfo.nombre.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm leading-tight">{empleadoInfo.nombre}</p>
                      <p className="text-xs text-slate-400 font-mono">Titular del código QR</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleVerificar} className="w-full space-y-4">
                  {/* Campo Usuario */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-500">Nombre de Usuario</label>
                    <input
                      ref={usuarioRef}
                      type="text"
                      autoCapitalize="none"
                      autoCorrect="off"
                      placeholder="Tu usuario del sistema"
                      value={usuarioInput}
                      onChange={e => { setUsuarioInput(e.target.value); setVerificacionError(''); }}
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3.5 text-base font-bold text-center focus:border-[#b5000b] focus:ring-4 focus:ring-[#b5000b]/10 outline-none text-slate-800 transition-all placeholder:text-slate-300"
                      autoFocus
                    />
                  </div>

                  {/* Campo Contraseña */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-500">Contraseña</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Tu contraseña del sistema"
                        value={passwordInput}
                        onChange={e => { setPasswordInput(e.target.value); setVerificacionError(''); }}
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3.5 pr-12 text-base font-bold focus:border-[#b5000b] focus:ring-4 focus:ring-[#b5000b]/10 outline-none text-slate-800 transition-all placeholder:text-slate-300"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {verificacionError && (
                    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl animate-fade-in">
                      <ShieldX size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-red-700 text-xs font-semibold leading-relaxed">{verificacionError}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={verificando || !usuarioInput.trim()}
                    className="w-full py-4 bg-[#b5000b] hover:bg-[#9b0009] text-white font-black rounded-xl text-sm uppercase tracking-wider transition-all shadow-lg shadow-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {verificando ? (
                      <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Verificando...</>
                    ) : (
                      <><ShieldCheck size={18} /> Verificar y Registrar Asistencia</>
                    )}
                  </button>
                </form>
              </>
            ) : (
              /* PASO 2: Resultado del registro */
              <div className={clsx(
                'w-full flex flex-col items-center text-center p-6 rounded-2xl border gap-4',
                registroStatus === 'success' ? 'bg-green-50/70 border-green-200' :
                registroStatus === 'loading' ? 'bg-slate-50 border-slate-200' :
                                               'bg-red-50/70 border-red-200'
              )}>
                <div className={clsx(
                  'w-14 h-14 rounded-2xl flex items-center justify-center',
                  registroStatus === 'success' ? 'bg-green-100 text-green-600' :
                  registroStatus === 'loading' ? 'bg-slate-100 text-slate-400' :
                                                 'bg-red-100 text-red-600'
                )}>
                  {registroStatus === 'success' ? <CheckCircle size={28} /> :
                   registroStatus === 'loading' ? <QrCode size={28} className="animate-pulse" /> :
                                                  <AlertCircle size={28} />}
                </div>

                <div>
                  <p className={clsx(
                    'text-xs font-black uppercase tracking-widest mb-2',
                    registroStatus === 'success' ? 'text-green-700' :
                    registroStatus === 'loading' ? 'text-slate-500' : 'text-red-700'
                  )}>
                    {registroStatus === 'success' ? '✅ Asistencia Registrada' :
                     registroStatus === 'loading' ? 'Procesando...' : '❌ Error al Registrar'}
                  </p>

                  {empleadoInfo && (
                    <p className="text-slate-900 font-bold text-lg leading-tight">
                      {empleadoInfo.nombre}
                      <span className="block font-mono text-xs text-slate-400 font-semibold mt-0.5">V-{empleadoInfo.cedula}</span>
                    </p>
                  )}
                </div>

                {registroMsg && (
                  <p className={clsx(
                    'text-xs font-medium border-t pt-3 w-full',
                    registroStatus === 'success' ? 'border-green-200 text-green-700' :
                    registroStatus === 'loading' ? 'border-slate-200 text-slate-400' : 'border-red-200 text-red-600'
                  )}>{registroMsg}</p>
                )}
              </div>
            )}

            <p className="text-center text-[10px] text-slate-300 font-medium mt-6 font-mono">
              © {new Date().getFullYear()} CORPOELEC · Sistema de Asistencia Digital
            </p>
          </div>
        </div>
      </div>
    );
  }

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
