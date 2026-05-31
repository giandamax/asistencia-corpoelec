import { useState, useEffect } from 'react';
import { Mail, ShieldAlert, CheckCircle2, Save, Send, Loader2 } from 'lucide-react';
import { useAlert } from '../components/AlertProvider';

export default function Configuracion() {
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

  return (
    <div className="max-w-3xl mx-auto space-y-8 mt-4 animate-fade-in">
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
