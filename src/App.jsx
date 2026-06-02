import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Directorio from './pages/Directorio';
import Aprobaciones from './pages/Aprobaciones';
import GenerarQR from './pages/GenerarQR';
import Reportes from './pages/Reportes';
import Configuracion from './pages/Configuracion';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import { AlertProvider } from './components/AlertProvider';
import { AuthProvider, useAuth } from './context/AuthContext';

// Wrapper that redirects to /login if not authenticated
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

// Wrapper that only allows admins — regular users see a pending screen
function AdminRoute({ children }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.rol !== 'admin') return <PendingApproval />;
  return children;
}

// Pantalla de espera para usuarios no-admin / Credencial digital de usuario aprobado
function PendingApproval() {
  const { user, logout } = useAuth();
  const [serverIp, setServerIp] = useState('');
  const [qrUrl, setQrUrl] = useState('');

  useEffect(() => {
    if (user?.aprobado) {
      const fetchInfo = async () => {
        try {
          const res = await fetch('/api/info');
          if (res.ok) {
            const data = await res.json();
            setServerIp(data.local_ip);
          }
        } catch (_) {}
      };
      fetchInfo();
    }
  }, [user]);

  useEffect(() => {
    if (user && user.aprobado) {
      const token = `USER_${user.id}_${user.cedula_identidad}`;
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const isLanIp = serverIp && /^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(serverIp);
      const localPort = window.location.port || '5173';
      const base = isLocalhost && isLanIp
        ? `http://${serverIp}:${localPort}`
        : window.location.origin;
      setQrUrl(`${base}/reportes?empleado=${user.id}&token=${encodeURIComponent(token)}`);
    }
  }, [user, serverIp]);

  if (user?.aprobado) {
    const initials = user.nombres.charAt(0) + user.apellidos.charAt(0);
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{
        background: 'linear-gradient(135deg, #001026 0%, #002b67 50%, #001840 100%)'
      }}>
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in">
          {/* Header con estado verificado */}
          <div className="bg-green-600 px-8 py-6 flex flex-col items-center gap-2 text-center">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h1 className="text-lg font-black text-white headline-font tracking-tight">Registro Verificado y Exitoso</h1>
            <p className="text-white/80 text-xs font-semibold">Credencial de Asistencia Digital</p>
          </div>

          <div className="p-8 flex flex-col items-center text-center">
            {/* Foto de perfil o Iniciales */}
            {user.foto_perfil ? (
              <img
                src={user.foto_perfil}
                alt="Foto de perfil"
                className="w-20 h-20 rounded-2xl object-cover border-4 border-slate-100 shadow-sm mb-4"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl mb-4 border border-slate-100 shadow-sm">
                {initials}
              </div>
            )}

            <h2 className="text-xl font-black text-on-surface leading-tight">
              {user.nombres} {user.apellidos}
            </h2>
            <p className="text-sm font-semibold text-slate-400 mt-0.5">@{user.usuario}</p>

            <div className="mt-4 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold text-on-surface-variant flex gap-4">
              <div>
                <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Cédula</span>
                <span className="font-mono text-on-surface text-sm">{user.cedula_identidad}</span>
              </div>
              <div className="w-px bg-slate-200"></div>
              <div>
                <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Rol</span>
                <span className="text-on-surface text-sm uppercase tracking-wide">Empleado</span>
              </div>
            </div>

            {/* Código QR */}
            <div className="my-6 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-center">
              {qrUrl ? (
                <QRCodeSVG value={qrUrl} size={180} />
              ) : (
                <div className="w-[180px] h-[180px] bg-slate-50 rounded-xl flex items-center justify-center text-xs font-semibold text-slate-400">
                  Generando código QR...
                </div>
              )}
            </div>

            <p className="text-xs text-slate-500 max-w-xs mb-6">
              Presente este código QR ante el dispositivo lector para registrar su asistencia diaria al ingresar y salir.
            </p>

            <button
              onClick={logout}
              className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-all hover:scale-[1.02]"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Pantalla para usuario no aprobado: Mensaje de espera
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{
      background: 'linear-gradient(135deg, #001026 0%, #002b67 50%, #001840 100%)'
    }}>
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-[#b5000b] px-8 py-6 flex flex-col items-center gap-2">
          <span className="text-3xl">⏳</span>
          <h1 className="text-lg font-black text-white">Cuenta pendiente de aprobación</h1>
        </div>
        <div className="p-8 text-center">
          <p className="text-slate-600 text-sm font-medium mb-2">
            Hola, <strong>{user?.nombres} {user?.apellidos}</strong>.
          </p>
          <p className="text-slate-500 text-sm mb-6">
            Tu cuenta ha sido creada correctamente pero aún no tienes acceso al sistema.
            Un administrador debe aprobarte antes de que puedas ingresar.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
            <p className="text-amber-700 text-xs font-semibold">
              📧 Comunícate con tu administrador para que active tu cuenta.
            </p>
          </div>
          <button
            onClick={logout}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}

// Wrapper for Reportes which allows public scans while keeping full tables protected
function ReportesRouteWrapper() {
  const { isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  if (isAuthenticated) {
    return (
      <Layout>
        <Reportes isPublic={false} />
      </Layout>
    );
  } else {
    if (token) {
      return <Reportes isPublic={true} />;
    } else {
      return <Navigate to="/login" replace />;
    }
  }
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/"
        element={
          <AdminRoute>
            <Layout />
          </AdminRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="directorio" element={<Directorio />} />
        <Route path="aprobaciones" element={<Aprobaciones />} />
        <Route path="qr" element={<GenerarQR />} />
        <Route path="configuracion" element={<Configuracion />} />
      </Route>
      {/* Route for Reportes, handled dynamically */}
      <Route path="/reportes" element={<ReportesRouteWrapper />} />
      {/* Reset password (public) */}
      <Route path="/reset-password" element={<ResetPassword />} />
      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AlertProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AlertProvider>
    </AuthProvider>
  );
}

export default App;
