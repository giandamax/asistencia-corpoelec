import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Directorio from './pages/Directorio';
import GenerarQR from './pages/GenerarQR';
import Reportes from './pages/Reportes';
import Login from './pages/Login';
import Scan from './pages/Scan';
import { AlertProvider } from './components/AlertProvider';
import { AuthProvider, useAuth } from './context/AuthContext';

// Guarda la URL original (con query params) y redirige al login
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      {/* Ruta pública: escaneo QR sin login */}
      <Route path="/scan" element={<Scan />} />

      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="directorio" element={<Directorio />} />
        <Route path="qr" element={<GenerarQR />} />
        <Route path="reportes" element={<Reportes />} />
      </Route>
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
