import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

const AlertContext = createContext();

export function AlertProvider({ children }) {
  const [alerts, setAlerts] = useState([]);

  const showAlert = useCallback((message, type = 'success') => {
    const id = Date.now();
    setAlerts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setAlerts((prev) => prev.filter((alert) => alert.id !== id));
    }, 3000);
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <div className="fixed top-20 right-5 z-[1000] flex flex-col gap-2 no-print">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`flex items-center gap-3 px-5 py-4 rounded-xl shadow-lg text-white font-bold animate-fade-in ${
              alert.type === 'success' ? 'bg-[#2e7d32]' : 'bg-[#c62828]'
            }`}
          >
            {alert.type === 'success' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
            {alert.message}
          </div>
        ))}
      </div>
    </AlertContext.Provider>
  );
}

export const useAlert = () => useContext(AlertContext);
