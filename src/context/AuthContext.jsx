import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = sessionStorage.getItem('corpoelec_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback((userData) => {
    sessionStorage.setItem('corpoelec_user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('corpoelec_user');
    setUser(null);
  }, []);

  // Actualiza los datos del usuario en sesión sin necesidad de re-login
  const updateUser = useCallback((newData) => {
    setUser(prev => {
      const updated = { ...prev, ...newData };
      sessionStorage.setItem('corpoelec_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
