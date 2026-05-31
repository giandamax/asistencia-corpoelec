import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { KeyRound, CheckCircle2, AlertCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import CorpoelecLogo from '../components/CorpoelecLogo';

const INPUT_CLASS =
  'w-full px-5 py-4 bg-surface-container-low text-on-surface rounded-xl font-medium outline-none border-0 border-b-2 border-transparent focus:border-primary transition-colors placeholder:text-slate-400';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPass.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return; }
    if (newPass !== confirm)  { setError('Las contraseñas no coinciden.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/reset_password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: newPass }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message);
        setTimeout(() => navigate('/login', { replace: true }), 2500);
      } else {
        setError(data.message);
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-black text-on-surface mb-2">Enlace inválido</h2>
          <p className="text-on-surface-variant mb-6">Este enlace de recuperación no es válido.</p>
          <button onClick={() => navigate('/login')} className="px-6 py-3 bg-primary text-white font-bold rounded-xl">
            Ir al Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Fondo */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/login-bg.png)', filter: 'blur(3px) brightness(0.45)', transform: 'scale(1.05)' }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#001026]/60 via-[#001d47]/50 to-[#002b67]/70" />

      <div className="w-full max-w-md z-10 animate-fade-in">
        {/* Branding */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-white shadow-2xl mb-5">
            <CorpoelecLogo size={58} />
          </div>
          <h1 className="text-3xl font-black text-white headline-font tracking-tighter">CORPOELEC</h1>
          <p className="text-white/60 font-semibold mt-1 uppercase tracking-widest text-xs">Sistema de Asistencia</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <KeyRound size={24} className="text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-black text-on-surface headline-font leading-tight">Nueva Contraseña</h2>
              <p className="text-xs text-on-surface-variant font-medium">Elige una contraseña segura</p>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-5">
              <AlertCircle size={18} className="flex-shrink-0" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 mb-5">
              <CheckCircle2 size={18} className="flex-shrink-0" />
              <p className="text-sm font-semibold">{success} Redirigiendo...</p>
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-black text-on-surface-variant uppercase tracking-widest">Nueva Contraseña</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={newPass}
                    onChange={e => { setNewPass(e.target.value); setError(''); }}
                    placeholder="Mínimo 6 caracteres"
                    className={`${INPUT_CLASS} pr-14`}
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-on-surface">
                    {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-on-surface-variant uppercase tracking-widest">Confirmar Contraseña</label>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => { setConfirm(e.target.value); setError(''); }}
                  placeholder="Repite la contraseña"
                  className={INPUT_CLASS}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-[0_10px_30px_rgba(181,0,11,0.25)] hover:bg-primary-container transition-all disabled:opacity-70 mt-2"
              >
                {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
              </button>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <button onClick={() => navigate('/login')}
              className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary font-semibold transition-colors">
              <ArrowLeft size={16} /> Volver al login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
