import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Zap, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Si hay URL de origen guardada (ej: desde escaneo QR) volver a ella; sino al dashboard
  const from = location.state?.from
    ? location.state.from.pathname + (location.state.from.search || '')
    : '/dashboard';

  const [form, setForm] = useState({ usuario: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

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
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-fade-in relative">
        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary shadow-[0_20px_50px_rgba(181,0,11,0.35)] mb-6">
            <Zap size={40} className="text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-black text-on-surface headline-font tracking-tighter leading-none">
            CORPOELEC
          </h1>
          <p className="text-on-surface-variant font-semibold mt-2 uppercase tracking-widest text-xs">
            Sistema de Asistencia Digital
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-[0_40px_100px_rgba(0,0,0,0.08)] border border-slate-100 p-10">
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
            {/* Usuario */}
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
                className="w-full px-5 py-4 bg-surface-container-low text-on-surface rounded-xl font-medium outline-none border-0 border-b-2 border-transparent focus:border-primary transition-colors placeholder:text-slate-400 [&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_#f3f4f5] [&:-webkit-autofill]:[color:#191c1d]"
              />
            </div>

            {/* Contraseña */}
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
                  className="w-full px-5 py-4 pr-14 bg-surface-container-low text-on-surface rounded-xl font-medium outline-none border-0 border-b-2 border-transparent focus:border-primary transition-colors placeholder:text-slate-400 [&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_#f3f4f5] [&:-webkit-autofill]:[color:#191c1d]"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                  tabIndex={-1}
                  title={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Submit */}
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
        </div>

        <p className="text-center text-xs text-on-surface-variant font-medium mt-6 opacity-60">
          © {new Date().getFullYear()} Corpoelec — Acceso restringido al personal autorizado
        </p>
      </div>
    </div>
  );
}
