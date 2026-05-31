import { useState, useEffect, useRef } from 'react';
import { Mail, ShieldAlert, CheckCircle2, Save, Send, Loader2, User, Camera, Lock, Eye, EyeOff } from 'lucide-react';
import { useAlert } from '../components/AlertProvider';
import { useAuth } from '../context/AuthContext';

export default function Configuracion() {
  const { user, updateUser } = useAuth();

  // ── Perfil ──────────────────────────────────────────────────────────────────
  const [perfil, setPerfil] = useState({
    nombres: user?.nombres || '',
    apellidos: user?.apellidos || '',
    correo: user?.correo || '',
    foto_perfil: user?.foto_perfil || null,
    password: '',
    password_confirm: '',
  });
  const [savingPerfil, setSavingPerfil] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showPassConfirm, setShowPassConfirm] = useState(false);
  const [fotoPreview, setFotoPreview] = useState(user?.foto_perfil || null);
  const fileInputRef = useRef(null);

  // ── Email ────────────────────────────────────────────────────────────────────
  const [config, setConfig] = useState({
    email_habilitado: false,
    email_remitente: '',
    email_password: '',
  });
  const [testEmail, setTestEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const { showAlert } = useAlert();

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/config');
        if (res.ok) {
          const data = await res.json();
          setConfig({
            email_habilitado: data.email_habilitado,
            email_remitente: data.email_remitente || '',
            email_password: data.email_password || '',
          });
        } else {
          showAlert('Error al cargar la configuración', 'error');
        }
      } catch (_) {
        showAlert('Error de conexión con el servidor', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, [showAlert]);

  // ── Foto de perfil ───────────────────────────────────────────────────────────
  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showAlert('La imagen no debe superar los 2 MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setFotoPreview(reader.result);
      setPerfil(prev => ({ ...prev, foto_perfil: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFoto = () => {
    setFotoPreview(null);
    setPerfil(prev => ({ ...prev, foto_perfil: null }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Guardar Perfil ───────────────────────────────────────────────────────────
  const handleSavePerfil = async (e) => {
    e.preventDefault();
    if (perfil.password && perfil.password !== perfil.password_confirm) {
      showAlert('Las contraseñas no coinciden.', 'error');
      return;
    }
    if (perfil.password && perfil.password.length < 4) {
      showAlert('La contraseña debe tener al menos 4 caracteres.', 'error');
      return;
    }
    setSavingPerfil(true);
    try {
      const body = {
        id: user.id,
        nombres: perfil.nombres,
        apellidos: perfil.apellidos,
        correo: perfil.correo,
        foto_perfil: perfil.foto_perfil,
      };
      if (perfil.password) body.password = perfil.password;

      const res = await fetch('/api/perfil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (res.ok) {
        updateUser(result.user);
        setPerfil(prev => ({ ...prev, password: '', password_confirm: '' }));
        showAlert('Perfil actualizado correctamente.', 'success');
      } else {
        showAlert(result.message || 'Error al guardar el perfil.', 'error');
      }
    } catch (_) {
      showAlert('Error al conectar con el servidor.', 'error');
    } finally {
      setSavingPerfil(false);
    }
  };

  // ── Guardar Configuración Email ───────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const result = await res.json();
      if (res.ok) {
        showAlert(result.message || 'Configuración guardada.', 'success');
      } else {
        showAlert(result.message || 'Error al guardar.', 'error');
      }
    } catch (_) {
      showAlert('Error al conectar con el servidor.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTestSMTP = async () => {
    if (!testEmail) {
      showAlert('Introduce un correo para enviar la prueba.', 'error');
      return;
    }
    setTesting(true);
    try {
      const res = await fetch('/api/config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          correo: testEmail,
          email_remitente: config.email_remitente,
          email_password: config.email_password,
        }),
      });
      const result = await res.json();
      if (res.ok) {
        showAlert(result.message || 'Correo de prueba enviado.', 'success');
      } else {
        showAlert(result.message || 'Fallo de prueba SMTP.', 'error');
      }
    } catch (_) {
      showAlert('Error de conexión al probar SMTP.', 'error');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const initials = (perfil.nombres?.charAt(0) || '') + (perfil.apellidos?.charAt(0) || '');

  return (
    <div className="max-w-3xl mx-auto space-y-8 mt-4 animate-fade-in">

      {/* ── Editar Perfil ── */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 md:p-10">
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center flex-shrink-0">
            <User size={24} />
          </div>
          <div>
            <h3 className="text-3xl font-black headline-font text-on-surface leading-none">
              Editar Perfil
            </h3>
            <p className="text-slate-400 text-xs mt-1.5 font-medium">
              Actualiza tu información personal y foto de perfil.
            </p>
          </div>
        </div>

        <form onSubmit={handleSavePerfil} className="space-y-7">
          {/* ── Foto de perfil ── */}
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-100 shadow-md bg-primary/10 flex items-center justify-center">
                {fotoPreview ? (
                  <img src={fotoPreview} alt="Foto de perfil" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-black text-primary headline-font">{initials || '?'}</span>
                )}
              </div>
              {/* Botón de cámara superpuesto */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#9b0009] transition-colors border-2 border-white"
                title="Cambiar foto"
              >
                <Camera size={14} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFotoChange}
              />
            </div>
            <div className="flex flex-col gap-2 text-center sm:text-left">
              <p className="font-bold text-slate-800 text-sm">Foto de Perfil</p>
              <p className="text-xs text-slate-400 font-medium">
                JPG, PNG o WEBP · Máximo 2 MB
              </p>
              <div className="flex gap-2 justify-center sm:justify-start">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-1.5 text-xs font-bold rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  {fotoPreview ? 'Cambiar foto' : 'Subir foto'}
                </button>
                {fotoPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveFoto}
                    className="px-4 py-1.5 text-xs font-bold rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── Datos personales ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500">Nombres</label>
              <input
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-medium text-slate-800 transition-all placeholder:text-slate-400"
                placeholder="Tu nombre"
                value={perfil.nombres}
                onChange={(e) => setPerfil({ ...perfil, nombres: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500">Apellidos</label>
              <input
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-medium text-slate-800 transition-all placeholder:text-slate-400"
                placeholder="Tu apellido"
                value={perfil.apellidos}
                onChange={(e) => setPerfil({ ...perfil, apellidos: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-slate-500">Correo Electrónico</label>
            <input
              type="email"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-medium text-slate-800 transition-all placeholder:text-slate-400"
              placeholder="correo@ejemplo.com"
              value={perfil.correo}
              onChange={(e) => setPerfil({ ...perfil, correo: e.target.value })}
            />
          </div>

          {/* ── Cambiar contraseña (opcional) ── */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-4">
              <Lock size={16} className="text-slate-400" />
              <p className="text-xs font-black uppercase tracking-wider text-slate-500">Cambiar Contraseña <span className="normal-case font-medium text-slate-400">(opcional)</span></p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500">Nueva Contraseña</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-10 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-medium text-slate-800 transition-all placeholder:text-slate-400"
                    placeholder="Dejar vacío para no cambiar"
                    value={perfil.password}
                    onChange={(e) => setPerfil({ ...perfil, password: e.target.value })}
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500">Confirmar Contraseña</label>
                <div className="relative">
                  <input
                    type={showPassConfirm ? 'text' : 'password'}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-10 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-medium text-slate-800 transition-all placeholder:text-slate-400"
                    placeholder="Repetir nueva contraseña"
                    value={perfil.password_confirm}
                    onChange={(e) => setPerfil({ ...perfil, password_confirm: e.target.value })}
                  />
                  <button type="button" onClick={() => setShowPassConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Botón guardar ── */}
          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={savingPerfil}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-[#9b0009] text-white font-bold text-sm shadow-sm hover:shadow-md transition-all disabled:opacity-50"
            >
              {savingPerfil ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Guardar Perfil
            </button>
          </div>
        </form>
      </div>

      {/* ── Configuración de Email ── */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 md:p-10">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-[#002b67]/5 text-primary flex items-center justify-center flex-shrink-0">
            <Mail size={24} />
          </div>
          <div>
            <h3 className="text-3xl font-black headline-font text-on-surface leading-none">
              Notificaciones por Correo
            </h3>
            <p className="text-slate-400 text-xs mt-1.5 font-medium">
              Configure las notificaciones de confirmación de asistencia automáticas.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Toggle Enable Notification */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
            <div>
              <p className="font-bold text-sm text-slate-800">Habilitar envíos de confirmación</p>
              <p className="text-[11px] text-slate-400 font-medium">Envía un email al trabajador al registrar su asistencia diaria.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={config.email_habilitado}
                onChange={(e) => setConfig({ ...config, email_habilitado: e.target.checked })}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Email Settings Fields */}
          <div className={`space-y-5 transition-all duration-300 ${config.email_habilitado ? 'opacity-100 pointer-events-auto' : 'opacity-50 pointer-events-none'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500">Correo Remitente (Gmail)</label>
                <input
                  type="email"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-medium text-slate-800 transition-all placeholder:text-slate-400"
                  placeholder="ejemplo@gmail.com"
                  value={config.email_remitente}
                  onChange={(e) => setConfig({ ...config, email_remitente: e.target.value })}
                  disabled={!config.email_habilitado}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500">Contraseña de Aplicación</label>
                <input
                  type="password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-medium text-slate-800 transition-all placeholder:text-slate-400"
                  placeholder="Contraseña de 16 caracteres"
                  value={config.email_password}
                  onChange={(e) => setConfig({ ...config, email_password: e.target.value })}
                  disabled={!config.email_habilitado}
                />
              </div>
            </div>

            {/* Instruction Warning Box */}
            <div className="p-5 bg-amber-50/70 border border-amber-200/80 text-amber-900 rounded-2xl text-xs space-y-3 font-medium backdrop-blur-sm">
              <p className="font-bold flex items-center gap-2 text-amber-800 text-sm">
                <ShieldAlert size={18} className="text-amber-600" />
                Configuración de Correo Remitente (Gmail):
              </p>
              <p className="text-[11px] text-amber-800 font-semibold">
                IMPORTANTE: Google no permite usar la contraseña estándar de tu correo para aplicaciones externas. Debes seguir estos pasos para generar una contraseña segura especial:
              </p>
              <ol className="list-decimal pl-5 space-y-1.5 text-[11px] text-amber-700">
                <li>Ve a la configuración de tu <a href="https://myaccount.google.com/" target="_blank" rel="noopener noreferrer" className="underline text-amber-900 font-bold hover:text-amber-950">Cuenta de Google</a>.</li>
                <li>En el panel izquierdo, selecciona <strong>Seguridad</strong>.</li>
                <li>Asegúrate de tener activa la <strong>Verificación en dos pasos</strong>. Si no lo está, actívala primero.</li>
                <li>En la barra de búsqueda de la parte superior de tu Cuenta de Google, escribe <strong>"Contraseñas de aplicación"</strong> y selecciónala.</li>
                <li>Escribe un nombre para identificarla (ejemplo: <em>Sistema de Asistencia</em>) y haz clic en <strong>Crear</strong>.</li>
                <li>Copia el código de <strong>16 caracteres</strong> que aparecerá en pantalla y pégalo arriba en el campo "Contraseña de Aplicación".</li>
              </ol>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-[#002b67]/90 text-white font-bold text-sm shadow-sm hover:shadow-md transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Guardar Configuración
            </button>
          </div>
        </form>
      </div>

      {/* SMTP Test Tool Panel */}
      {config.email_habilitado && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 md:p-10 animate-fade-in">
          <h4 className="font-black text-slate-800 text-lg mb-2">Herramienta de Prueba de Servidor SMTP</h4>
          <p className="text-slate-400 text-xs font-medium mb-5">
            Verifique la conexión SMTP enviando un correo electrónico de prueba en tiempo real.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="Correo destinatario de prueba"
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-medium text-slate-800 transition-all placeholder:text-slate-400"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
            <button
              onClick={handleTestSMTP}
              disabled={testing || !testEmail}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm shadow-sm hover:shadow-md transition-all disabled:opacity-50"
            >
              {testing ? <Loader2 size={16} className="animate-spin" /> : <Send size={14} />}
              Enviar Correo de Prueba
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
