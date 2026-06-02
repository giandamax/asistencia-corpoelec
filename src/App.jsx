import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Directorio from './pages/Directorio';
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

// Pantalla de espera para usuarios no-admin
function PendingApproval() {
  const { user, logout } = useAuth();
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
