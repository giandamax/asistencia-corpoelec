import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useAlert } from '../components/AlertProvider';
import { useLocation } from 'react-router-dom';
import CorpoelecLogo from '../components/CorpoelecLogo';

// Builds the URL that the QR will encode
const buildQrUrl = (userId, cedula, serverIp) => {
  const localPort = window.location.port || '5173';
  const base = serverIp && serverIp !== '127.0.0.1'
    ? `http://${serverIp}:${localPort}`
    : window.location.origin;
  const token = `USER_${userId}_${cedula}`;
  return `${base}/reportes?empleado=${userId}&token=${encodeURIComponent(token)}`;
};

export default function GenerarQR() {
  const [usuarios, setUsuarios] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [qrData, setQrData] = useState('');
  const [userName, setUserName] = useState('');
  const [serverIp, setServerIp] = useState('');
  const { showAlert } = useAlert();
  const location = useLocation();

  useEffect(() => {
    const fetchInfoAndUsuarios = async () => {
      let resolvedIp = '';
      try {
        // Consultar la IP local del backend
        const infoRes = await fetch('/api/info');
        if (infoRes.ok) {
          const infoData = await infoRes.json();
          resolvedIp = infoData.local_ip;
          setServerIp(resolvedIp);
        }
      } catch (_) {
        // Silently ignore
      }

      try {
        const res = await fetch('/api/usuarios');
        const data = await res.json();
        setUsuarios(data);

        // Auto select if navigated from directory with a userId
        if (location.state?.userId) {
          const user = data.find(u => u.id === location.state.userId);
          if (user) {
            setSelectedUser(String(user.id));
            setQrData(buildQrUrl(user.id, user.cedula_identidad, resolvedIp));
            setUserName(`${user.nombres} ${user.apellidos}`);
          }
        }
      } catch (err) {
        showAlert('Error cargando usuarios', 'error');
      }
    };
    fetchInfoAndUsuarios();
  }, [location.state, showAlert]);

  const handleGenerate = () => {
    if (selectedUser) {
      const user = usuarios.find(u => String(u.id) === selectedUser);
      if (user) {
        setQrData(buildQrUrl(user.id, user.cedula_identidad, serverIp));
        setUserName(`${user.nombres} ${user.apellidos}`);
      }
    } else {
      showAlert('Por favor seleccione un usuario', 'error');
    }
  };

  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const localPort = window.location.port || '5173';
  const ipRedirectUrl = serverIp && serverIp !== '127.0.0.1' ? `http://${serverIp}:${localPort}${window.location.pathname}${window.location.search}` : '';

  return (
    <div className="w-full max-w-2xl mx-auto mt-4">
      {isLocalhost && serverIp && serverIp !== '127.0.0.1' && (
        <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-900 px-6 py-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in no-print shadow-sm">
          <div className="flex items-start gap-3">
            <span className="text-xl mt-0.5">⚠️</span>
            <div>
              <p className="font-bold text-sm">Aviso de Red Local (Escaneo QR)</p>
              <p className="text-xs text-amber-700 font-medium">
                Estás navegando en <strong>localhost</strong>. Los códigos QR generados aquí usarán la dirección local y no podrán abrirse desde tu teléfono móvil.
              </p>
            </div>
          </div>
          <a
            href={ipRedirectUrl}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all self-start sm:self-center text-center shadow-sm"
          >
            Cambiar a IP de Red ({serverIp})
          </a>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm overflow-hidden p-10 border border-slate-100">
        <div className="mb-8">
        <h3 className="text-3xl font-black headline-font text-on-surface leading-none">
          Terminal de Credenciales QR
        </h3>
        <p className="text-on-surface-variant mt-2 font-medium">
          Consulte y genere la credencial QR del personal registrado para imprimir o enviar.
        </p>
      </div>
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-black text-on-surface-variant uppercase tracking-widest">
            Seleccionar Usuario
          </label>
          <CustomSelect
            usuarios={usuarios}
            selectedUser={selectedUser}
            onSelect={(id) => {
              setSelectedUser(id);
              setQrData('');
              setUserName('');
            }}
          />
        </div>
        <button
          onClick={handleGenerate}
          className="w-full px-8 py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary-container transition-colors flex items-center justify-center gap-3 shadow-[0_8px_24px_rgba(181,0,11,0.2)]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            <path d="M14 14h3v3M17 20h3M20 17h-3"/>
          </svg>
          Generar y Mostrar Código QR
        </button>

        {qrData && (
          <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col items-center justify-center animate-fade-in no-print">
            {/* Tarjeta de Credencial Física */}
            <div className="w-full max-w-sm bg-gradient-to-b from-slate-50 to-slate-100 rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.06)] p-8 flex flex-col items-center text-center relative">
              {/* Encabezado Corporativo de la Tarjeta */}
              <div className="flex items-center gap-2 mb-6">
                <CorpoelecLogo size={32} />
                <span className="text-base font-black text-slate-900 tracking-tighter">CORPOELEC</span>
              </div>
              
              {/* Contenedor del QR con brillo */}
              <div className="bg-white p-5 rounded-3xl shadow-[0_15px_40px_rgba(0,0,0,0.04)] border border-slate-100 mb-6 inline-block">
                <QRCodeSVG value={qrData} size={200} level={"H"} includeMargin />
              </div>

              {/* Nombre e Información del Empleado */}
              <div className="space-y-1">
                <p className="text-2xl font-black text-slate-800 tracking-tight leading-tight">{userName}</p>
                <p className="text-xs font-bold text-primary uppercase tracking-widest">Credencial Digital QR</p>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-200/60 w-full flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                <span>V-{usuarios.find(u => String(u.id) === selectedUser)?.cedula_identidad}</span>
                <span className="text-green-600">● Activo</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-300 mt-4 font-mono break-all max-w-xs text-center">{qrData}</p>
          </div>
        )}
      </div>
    </div>
  </div>
  );
}

/* ── Custom Dropdown con Portal ──────────────────────────────── */
function CustomSelect({ usuarios, selectedUser, onSelect }) {
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const triggerRef = useRef(null);

  const selected = usuarios.find(u => String(u.id) === selectedUser);

  // Calcula la posición del panel relativa al trigger en el viewport
  useLayoutEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
    }
  }, [open]);

  const handleSelect = (id) => {
    onSelect(id);
    setOpen(false);
  };

  const dropdownPanel = open && (
    <div
      style={dropdownStyle}
      className="bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden animate-fade-in"
    >
      {/* Empty state */}
      {usuarios.length === 0 && (
        <div className="px-6 py-4 text-sm text-on-surface-variant font-medium">
          No hay usuarios registrados.
        </div>
      )}

      {/* Opción vacía / reset */}
      <div
        onClick={() => handleSelect('')}
        className={`px-6 py-3 flex items-center gap-3 cursor-pointer transition-colors border-b border-slate-50
          ${!selectedUser ? 'bg-primary/5 text-primary' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
      >
        <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </span>
        <span className="text-sm font-semibold">Seleccione un usuario...</span>
      </div>

      {/* Lista con scroll */}
      <div className="max-h-64 overflow-y-auto">
        {usuarios.map(u => {
          const isActive = String(u.id) === selectedUser;
          const initials = u.nombres.charAt(0) + u.apellidos.charAt(0);
          return (
            <div
              key={u.id}
              onClick={() => handleSelect(String(u.id))}
              className={`px-6 py-3 flex items-center gap-3 cursor-pointer transition-colors group
                ${isActive ? 'bg-primary/5' : 'hover:bg-surface-container-low'}`}
            >
              {/* Avatar */}
              <span className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 transition-colors
                ${isActive ? 'bg-primary text-white' : 'bg-primary/10 text-primary group-hover:bg-primary/20'}`}>
                {initials}
              </span>
              {/* Nombre y cédula */}
              <span className="flex-1 min-w-0">
                <span className={`block font-semibold text-sm truncate ${isActive ? 'text-primary' : 'text-on-surface'}`}>
                  {u.nombres} {u.apellidos}
                </span>
                <span className="block text-xs text-on-surface-variant font-mono">
                  V-{u.cedula_identidad}
                </span>
              </span>
              {/* Check activo */}
              {isActive && (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                  className="text-primary flex-shrink-0">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="relative">
      {/* Overlay invisible para cerrar al hacer clic afuera */}
      {open && (
        <div className="fixed inset-0" style={{ zIndex: 9998 }} onClick={() => setOpen(false)} />
      )}

      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="w-full px-6 py-4 bg-surface-container-low rounded-xl font-medium outline-none cursor-pointer text-left flex items-center justify-between gap-3 transition-all"
        style={{
          border: 'none',
          borderBottom: `2px solid ${open ? '#b5000b' : 'transparent'}`,
        }}
      >
        {selected ? (
          <span className="flex items-center gap-3 min-w-0">
            <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
              {selected.nombres.charAt(0)}{selected.apellidos.charAt(0)}
            </span>
            <span className="font-semibold text-on-surface truncate">
              {selected.nombres} {selected.apellidos}
            </span>
            <span className="text-xs text-on-surface-variant font-mono flex-shrink-0">
              V-{selected.cedula_identidad}
            </span>
          </span>
        ) : (
          <span className="text-on-surface-variant">Seleccione un usuario...</span>
        )}
        <svg
          xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className={`flex-shrink-0 text-on-surface-variant transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Portal: renderiza el panel fuera del árbol DOM, directo en body */}
      {createPortal(dropdownPanel, document.body)}
    </div>
  );
}
