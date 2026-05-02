import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader, Zap, Clock, LogIn, AlertTriangle } from 'lucide-react';

export default function Scan() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'already' | 'error' | 'invalid'
  const [message, setMessage] = useState('');
  const [empleado, setEmpleado] = useState('');
  const [hora, setHora] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      setMessage('Código QR inválido o incompleto.');
      return;
    }

    const registrar = async () => {
      try {
        const res = await fetch('/api/asistencias', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qr_data: decodeURIComponent(token) }),
        });
        const data = await res.json();

        if (res.ok) {
          // Registro exitoso
          setStatus('success');
          setMessage('Tu entrada quedó guardada en el sistema.');
          const match = data.message?.match(/correctamente: (.+)/);
          if (match) setEmpleado(match[1]);
        } else {
          // Verificar si es "ya registrado hoy" — en ese caso mostrar como advertencia, no error
          const msg = data.message || '';
          if (msg.toLowerCase().includes('ya fue registrada') || msg.toLowerCase().includes('ya registrad')) {
            setStatus('already');
            setMessage('Tu asistencia ya fue marcada anteriormente hoy.');
            const match = msg.match(/para (.+) ya fue/);
            if (match) setEmpleado(match[1]);
          } else {
            setStatus('error');
            setMessage(msg || 'No se pudo registrar. Contacta al administrador.');
          }
        }
      } catch {
        setStatus('error');
        setMessage('Error de conexión. Verifica que estés en la red correcta.');
      }

      // Hora actual
      const now = new Date();
      setHora(now.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }));
    };

    registrar();
  }, [token]);

  // Configuración visual por estado
  const config = {
    loading: {
      icon: <Loader size={40} className="text-slate-400 animate-spin" />,
      bg: 'bg-slate-100',
      bar: 'bg-slate-300 animate-pulse',
      title: 'Verificando...',
      titleColor: 'text-slate-500',
    },
    success: {
      icon: <CheckCircle size={40} className="text-green-500" strokeWidth={1.5} />,
      bg: 'bg-green-50',
      bar: 'bg-green-500',
      title: '¡Asistencia Registrada!',
      titleColor: 'text-green-700',
    },
    already: {
      icon: <AlertTriangle size={40} className="text-amber-500" strokeWidth={1.5} />,
      bg: 'bg-amber-50',
      bar: 'bg-amber-400',
      title: 'Ya Registrado Hoy',
      titleColor: 'text-amber-700',
    },
    error: {
      icon: <XCircle size={40} className="text-primary" strokeWidth={1.5} />,
      bg: 'bg-red-50',
      bar: 'bg-primary',
      title: 'Error al Registrar',
      titleColor: 'text-primary',
    },
    invalid: {
      icon: <XCircle size={40} className="text-slate-400" strokeWidth={1.5} />,
      bg: 'bg-slate-100',
      bar: 'bg-slate-400',
      title: 'QR Inválido',
      titleColor: 'text-slate-600',
    },
  };

  const c = config[status];

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

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.08)] overflow-hidden border border-slate-100">

        {/* Color bar */}
        <div className={`h-2 w-full transition-colors duration-500 ${c.bar}`} />

        <div className="px-8 py-10 flex flex-col items-center text-center">

          {/* Icon */}
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${c.bg}`}>
            {c.icon}
          </div>

          {/* Title */}
          <h1 className={`text-2xl font-black headline-font mb-2 ${c.titleColor}`}>
            {c.title}
          </h1>

          {/* Employee name */}
          {empleado && (
            <p className="text-lg font-bold text-on-surface mb-1">{empleado}</p>
          )}

          {/* Message */}
          <p className="text-sm font-medium text-on-surface-variant leading-relaxed">
            {message}
          </p>

          {/* Time badge */}
          {hora && status !== 'loading' && (
            <div className="mt-5 flex items-center gap-2 bg-surface-container-low px-4 py-2.5 rounded-xl">
              <Clock size={14} className={
                status === 'success' ? 'text-green-500' :
                status === 'already' ? 'text-amber-500' : 'text-slate-400'
              } />
              <span className="font-mono text-sm font-bold text-on-surface">{hora}</span>
              <span className="text-xs text-slate-400">—</span>
              <span className="text-xs font-semibold text-slate-500">
                {new Date().toLocaleDateString('es-VE', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
            </div>
          )}

          {/* Helper text */}
          {status !== 'loading' && (
            <p className="text-xs text-slate-400 mt-4 font-medium">
              {status === 'success' ? 'Puedes cerrar esta ventana.' :
               status === 'already' ? 'Solo se permite un registro por día.' :
               'Si el error persiste, contacta al administrador.'}
            </p>
          )}
        </div>

        {/* Admin login button */}
        <div className="px-8 pb-8">
          <div className="border-t border-slate-100 pt-5">
            <p className="text-xs text-center text-slate-400 font-medium mb-3">¿Eres administrador?</p>
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 w-full py-3 px-6 bg-surface-container-low text-on-surface hover:bg-primary hover:text-white transition-all font-bold rounded-xl text-sm border border-slate-200 hover:border-primary group"
            >
              <LogIn size={16} className="group-hover:rotate-0 transition-transform" />
              Iniciar Sesión — Panel de Control
            </Link>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-6 font-medium">
        Sistema Pulso Eléctrico · Corpoelec
      </p>
    </div>
  );
}
