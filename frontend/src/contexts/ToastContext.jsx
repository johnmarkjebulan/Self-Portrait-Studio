import React, { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const icons = {
    success: "✓", error: "✕", info: "ℹ", warning: "⚠",
  };
  const colors = {
    success: "bg-emerald-600", error: "bg-red-600", info: "bg-gray-700", warning: "bg-amber-500",
  };

  return (
    <ToastContext.Provider value={{ toast, showToast: toast }}>
      {children}
      <div className="fixed bottom-4 left-4 right-4 sm:bottom-6 sm:left-auto sm:right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`${colors[t.type]} text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 w-full sm:min-w-[280px] sm:w-auto max-w-sm ml-auto animate-slide-in pointer-events-auto`}>
            <span className="text-lg font-bold">{icons[t.type]}</span>
            <span className="text-sm font-medium">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
