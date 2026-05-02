import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Directorio from './pages/Directorio';
import GenerarQR from './pages/GenerarQR';
import Reportes from './pages/Reportes';
import Login from './pages/Login';
import { AlertProvider } from './components/AlertProvider';
import { AuthProvider, useAuth } from './context/AuthContext';

// Wrapper that redirects to /login if not authenticated
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
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
