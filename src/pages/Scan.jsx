import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader, Zap, Clock, Info, LogIn } from 'lucide-react';

export default function Scan() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error' | 'warning' | 'invalid'
  const [message, setMessage] = useState('');
  const [empleado, setEmpleado] = useState('');
  const [hora, setHora] = useState('');
  const isRegistered = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      setMessage('Código QR inválido o incompleto.');
      return;
    }
    if (isRegistered.current) return;
    isRegistered.current = true;

    const registrar = async () => {
      try {
        const res = await fetch('/api/asistencias', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qr_data: decodeURIComponent(token) }),
        });
        const data = await res.json();

        if (res.ok) {
          setStatus('success');
          setMessage(data.message || 'Asistencia registrada correctamente.');
          const match = data.message?.match(/correctamente: (.+)/);
          if (match) setEmpleado(match[1]);
        } else {
          // If already registered today, show a warning instead of a hard error
          if (data.message?.includes('ya fue registrada')) {
            setStatus('warning');
            setMessage(data.message);
            const match = data.message?.match(/para (.+) ya fue/);
            if (match) setEmpleado(match[1]);
          } else {
            setStatus('error');
            setMessage(data.message || 'No se pudo registrar la asistencia.');
          }
        }
      } catch {
        setStatus('error');
        setMessage('Error de conexión con el servidor. Intenta nuevamente.');
      }

      // Set current time
      const now = new Date();
      setHora(now.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }));
    };

    registrar();
  }, [token]);

  const isSuccess = status === 'success';
  const isLoading = status === 'loading';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">

      {/* Logo */}
      <div className="mb-8 flex items-center gap-3">
        <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
          <Zap size={24} className="text-white" fill="currentColor" />
        </div>
        <div>
          <p className="text-xl font-black text-primary tracking-tighter headline-font">CORPOELEC</p>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Asistencia Digital</p>
        </div>
      </div>

      {/* Status Card */}
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.08)] overflow-hidden border border-slate-100">

        {/* Color bar top */}
        <div className={`h-2 w-full ${isLoading ? 'bg-slate-200 animate-pulse' : isSuccess ? 'bg-green-500' : status === 'warning' ? 'bg-amber-500' : 'bg-primary'}`} />

        <div className="px-8 py-10 flex flex-col items-center text-center">

          {/* Icon */}
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${
            isLoading ? 'bg-slate-100' :
            isSuccess ? 'bg-green-50' : 
            status === 'warning' ? 'bg-amber-50' : 'bg-red-50'
          }`}>
            {isLoading ? (
              <Loader size={36} className="text-slate-400 animate-spin" />
            ) : isSuccess ? (
              <CheckCircle size={40} className="text-green-500" strokeWidth={1.5} />
            ) : status === 'warning' ? (
              <Info size={40} className="text-amber-500" strokeWidth={1.5} />
            ) : (
              <XCircle size={40} className="text-primary" strokeWidth={1.5} />
            )}
          </div>

          {/* Title */}
          <h1 className={`text-2xl font-black headline-font mb-2 ${
            isLoading ? 'text-slate-400' :
            isSuccess ? 'text-green-700' : 
            status === 'warning' ? 'text-amber-700' : 'text-on-surface'
          }`}>
            {isLoading ? 'Verificando...' :
             isSuccess ? '¡Asistencia Registrada!' :
             status === 'warning' ? 'Asistencia Previa' :
             status === 'error' ? 'No se pudo registrar' : 'QR Inválido'}
          </h1>

          {/* Employee name */}
          {empleado && (
            <p className="text-lg font-bold text-on-surface mb-1">{empleado}</p>
          )}

          {/* Message */}
          <p className={`text-sm font-medium ${
            isSuccess ? 'text-green-600' : 'text-on-surface-variant'
          }`}>
            {message}
          </p>

          {/* Time */}
          {hora && !isLoading && (
            <div className="mt-5 flex items-center gap-2 bg-surface-container-low px-4 py-2.5 rounded-xl">
              <Clock size={15} className={isSuccess ? 'text-green-500' : 'text-slate-400'} />
              <span className="font-mono text-sm font-bold text-on-surface">{hora}</span>
              <span className="text-xs text-slate-400 font-medium">—</span>
              <span className="text-xs font-semibold text-slate-500">
                {new Date().toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
            </div>
          )}

          {/* Instructions */}
          {!isLoading && (
            <p className="text-xs text-slate-400 mt-6 font-medium">
              {isSuccess || status === 'warning'
                ? 'Puedes cerrar esta ventana.'
                : 'Si el error persiste, contacta al administrador.'}
            </p>
          )}

          {/* Login Button */}
          <Link
            to="/login"
            className="mt-6 w-full py-3 px-4 bg-surface-container-low text-on-surface-variant hover:bg-slate-100 transition-colors rounded-xl font-bold text-sm flex items-center justify-center gap-2 border border-slate-200"
          >
            <LogIn size={16} />
            Iniciar Sesión Administrativa
          </Link>
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-6 font-medium">
        Sistema Pulso Eléctrico · Corpoelec
      </p>
    </div>
  );
}
