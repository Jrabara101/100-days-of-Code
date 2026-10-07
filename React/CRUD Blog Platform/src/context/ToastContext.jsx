import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 3200) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      {/* Toast Render Dock */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4 sm:px-0">
        {toasts.map((toast) => {
          let bgClass = 'bg-[#18181B] text-[#FAFAF8] dark:bg-[#1B1C21] dark:text-[#F4F4F6] border-[#3F3F46]';
          if (toast.type === 'success') {
            bgClass = 'bg-[#0D9488] text-white border-[#14B8A6]';
          } else if (toast.type === 'error') {
            bgClass = 'bg-[#E11D48] text-white border-[#F43F5E]';
          } else if (toast.type === 'accent') {
            bgClass = 'bg-[#4F46E5] text-white border-[#6366F1]';
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center justify-between px-4 py-3 rounded-lg shadow-xl text-xs sm:text-sm font-medium border transition-all transform animate-in fade-in slide-in-from-bottom-2 duration-200 ${bgClass}`}
            >
              <div className="flex items-center gap-2">
                <span>{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-3 text-white/70 hover:text-white p-0.5"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
