import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Zap, Eye, EyeOff, LogIn, AlertCircle,
  UserPlus, CheckCircle2, ChevronRight,
} from 'lucide-react';
import CorpoelecLogo from '../components/CorpoelecLogo';

const INPUT_CLASS =
  'w-full px-5 py-4 bg-surface-container-low text-on-surface rounded-xl font-medium outline-none border-0 border-b-2 border-transparent focus:border-primary transition-colors placeholder:text-slate-400 [&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_#f3f4f5] [&:-webkit-autofill]:[color:#191c1d]';

// ─── Formulario de Login ───────────────────────────────────────────────────
function LoginForm({ onSwitch }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ usuario: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.usuario || !form.password) {
      setError('Por favor complete todos los campos.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        login(data.user);
      } else {
        setError(data.message || 'Usuario o contraseña incorrectos.');
      }
    } catch {
      setError('No se pudo conectar con el servidor. ¿Está corriendo el backend?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2 className="text-2xl font-black headline-font text-on-surface mb-1">Iniciar Sesión</h2>
      <p className="text-on-surface-variant text-sm font-medium mb-8">
        Ingrese sus credenciales para acceder al panel.
      </p>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6 animate-fade-in">
          <AlertCircle size={18} className="flex-shrink-0" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-black text-on-surface-variant uppercase tracking-widest">
            Nombre de Usuario
          </label>
          <input
            name="usuario"
            value={form.usuario}
            onChange={handleChange}
            autoComplete="username"
            placeholder="jperez"
            className={INPUT_CLASS}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-on-surface-variant uppercase tracking-widest">
            Contraseña
          </label>
          <div className="relative">
            <input
              name="password"
              type={showPass ? 'text' : 'password'}
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
              placeholder="••••••••"
              className={`${INPUT_CLASS} pr-14`}
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
              tabIndex={-1}
            >
              {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary-container transition-all shadow-[0_10px_30px_rgba(181,0,11,0.25)] flex items-center justify-center gap-3 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Verificando...
            </>
          ) : (
            <>
              <LogIn size={20} />
              Entrar al Sistema
            </>
          )}
        </button>
      </form>

      {/* Switch to Register */}
      <div className="mt-8 pt-6 border-t border-slate-100 text-center">
        <p className="text-sm text-on-surface-variant font-medium">
          ¿No tienes una cuenta?{' '}
          <button
            onClick={onSwitch}
            className="text-primary font-bold hover:underline inline-flex items-center gap-1"
          >
            Regístrate aquí <ChevronRight size={14} />
          </button>
        </p>
      </div>
    </>
  );
}

// ─── Formulario de Registro ────────────────────────────────────────────────
function RegisterForm({ onSwitch }) {
  const { login } = useAuth();
  const [form, setForm] = useState({
    nombres: '', apellidos: '', cedula_identidad: '',
    correo: '', usuario: '', password: '', confirmar: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { nombres, apellidos, cedula_identidad, correo, usuario, password, confirmar } = form;

    if (!nombres || !apellidos || !cedula_identidad || !correo || !usuario || !password || !confirmar) {
      setError('Por favor complete todos los campos.');
      return;
    }
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombres, apellidos, cedula_identidad, correo, usuario, password }),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess('¡Cuenta creada! Iniciando sesión...');
        // Auto-login after successful registration
        const loginRes = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usuario, password }),
        });
        const loginData = await loginRes.json();
        if (loginRes.ok) {
          login(loginData.user);
        } else {
          setTimeout(() => onSwitch(), 1500);
        }
      } else {
        setError(data.message || 'Error al crear la cuenta.');
      }
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2 className="text-2xl font-black headline-font text-on-surface mb-1">Crear Cuenta</h2>
      <p className="text-on-surface-variant text-sm font-medium mb-6">
        Completa el formulario para registrarte en el sistema.
      </p>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-5 animate-fade-in">
          <AlertCircle size={18} className="flex-shrink-0" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 mb-5 animate-fade-in">
          <CheckCircle2 size={18} className="flex-shrink-0" />
          <p className="text-sm font-semibold">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-black text-on-surface-variant uppercase tracking-widest">Nombres</label>
            <input name="nombres" value={form.nombres} onChange={handleChange} placeholder="Juan" className={INPUT_CLASS} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-black text-on-surface-variant uppercase tracking-widest">Apellidos</label>
            <input name="apellidos" value={form.apellidos} onChange={handleChange} placeholder="Pérez" className={INPUT_CLASS} />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-black text-on-surface-variant uppercase tracking-widest">Cédula de Identidad</label>
          <input name="cedula_identidad" value={form.cedula_identidad} onChange={handleChange} placeholder="V-00000000" className={INPUT_CLASS} />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-black text-on-surface-variant uppercase tracking-widest">Correo Electrónico</label>
          <input name="correo" type="email" value={form.correo} onChange={handleChange} placeholder="correo@corpoelec.gob.ve" className={INPUT_CLASS} />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-black text-on-surface-variant uppercase tracking-widest">Nombre de Usuario</label>
          <input name="usuario" value={form.usuario} onChange={handleChange} placeholder="jperez" autoComplete="username" className={INPUT_CLASS} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-black text-on-surface-variant uppercase tracking-widest">Contraseña</label>
            <div className="relative">
              <input
                name="password"
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete="new-password"
                className={`${INPUT_CLASS} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                tabIndex={-1}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-black text-on-surface-variant uppercase tracking-widest">Confirmar</label>
            <input
              name="confirmar"
              type={showPass ? 'text' : 'password'}
              value={form.confirmar}
              onChange={handleChange}
              placeholder="••••••••"
              autoComplete="new-password"
              className={INPUT_CLASS}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary-container transition-all shadow-[0_10px_30px_rgba(181,0,11,0.25)] flex items-center justify-center gap-3 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Creando cuenta...
            </>
          ) : (
            <>
              <UserPlus size={20} />
              Crear Cuenta
            </>
          )}
        </button>
      </form>

      {/* Switch to Login */}
      <div className="mt-6 pt-5 border-t border-slate-100 text-center">
        <p className="text-sm text-on-surface-variant font-medium">
          ¿Ya tienes una cuenta?{' '}
          <button
            onClick={onSwitch}
            className="text-primary font-bold hover:underline inline-flex items-center gap-1"
          >
            Inicia sesión <ChevronRight size={14} />
          </button>
        </p>
      </div>
    </>
  );
}

// ─── Página Principal ──────────────────────────────────────────────────────
export default function Login() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#002b67] via-[#001d47] to-[#001026] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/[0.02] rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/[0.02] rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-container/[0.03] rounded-full blur-3xl" />
      </div>

      <div className={`w-full animate-fade-in relative transition-all duration-300 ${mode === 'register' ? 'max-w-lg' : 'max-w-md'} z-10`}>
        {/* Logo / Brand */}
        <div className="text-center mb-8 flex flex-col items-center justify-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2.5rem] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] mb-6 transition-transform duration-500 hover:scale-105">
            <CorpoelecLogo size={70} />
          </div>
          <h1 className="text-4xl font-black text-white headline-font tracking-tighter leading-none">
            CORPOELEC
          </h1>
          <p className="text-white/70 font-semibold mt-2 uppercase tracking-widest text-xs">
            Sistema de Asistencia Digital
          </p>
        </div>

        {/* Toggle Pills - Glassmorphism */}
        <div className="flex bg-white/10 backdrop-blur-md rounded-2xl p-1 mb-6 border border-white/10 shadow-inner">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              mode === 'login'
                ? 'bg-white shadow-md text-primary'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <LogIn size={16} /> Iniciar Sesión
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              mode === 'register'
                ? 'bg-white shadow-md text-primary'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <UserPlus size={16} /> Registrarse
          </button>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-[0_45px_100px_rgba(0,0,0,0.25)] border border-slate-100 p-10">
          {mode === 'login'
            ? <LoginForm onSwitch={() => setMode('register')} />
            : <RegisterForm onSwitch={() => setMode('login')} />
          }
        </div>

        <p className="text-center text-xs text-white/40 font-medium mt-6">
          © {new Date().getFullYear()} Corpoelec — Acceso restringido al personal autorizado
        </p>
      </div>
    </div>
  );
}
