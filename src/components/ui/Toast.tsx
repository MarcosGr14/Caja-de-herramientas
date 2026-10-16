import React, { createContext, useContext, useState, useCallback } from 'react';
import { Check, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastContextType {
  toast: (title: string, options?: { description?: string; type?: ToastType; duration?: number }) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (title: string, options?: { description?: string; type?: ToastType; duration?: number }) => {
      const id = Math.random().toString(36).substring(2, 9);
      const type = options?.type || 'success';
      const duration = options?.duration || 2600;

      setToasts((prev) => [...prev, { id, title, description: options?.description, type }]);

      setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  const success = useCallback(
    (title: string, description?: string) => addToast(title, { type: 'success', description }),
    [addToast]
  );
  const error = useCallback(
    (title: string, description?: string) => addToast(title, { type: 'error', description }),
    [addToast]
  );
  const info = useCallback(
    (title: string, description?: string) => addToast(title, { type: 'info', description }),
    [addToast]
  );

  const contextValue = React.useMemo(
    () => ({ toast: addToast, success, error, info }),
    [addToast, success, error, info]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {/* Toast container: minimal pill bottom-center, monochromatic editorial look */}
      <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none max-w-sm w-full px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-center justify-between gap-3 px-4 py-2.5 rounded-full shadow-2xl border border-hairline bg-[#111113] text-[#F4F4F5] dark:bg-[#F4F4F5] dark:text-[#111113] text-xs font-medium transition-all duration-200 animate-in fade-in slide-in-from-bottom-2"
          >
            <div className="flex items-center gap-2 min-w-0">
              {t.type === 'success' && <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600 shrink-0" />}
              {t.type === 'error' && <AlertCircle className="w-3.5 h-3.5 text-rose-400 dark:text-rose-600 shrink-0" />}
              {t.type === 'info' && <Info className="w-3.5 h-3.5 opacity-80 shrink-0" />}
              <span className="truncate">{t.title}</span>
            </div>
            {t.description && (
              <span className="text-[11px] opacity-70 hidden sm:inline truncate">
                {t.description}
              </span>
            )}
            <button
              onClick={() => removeToast(t.id)}
              className="p-1 opacity-60 hover:opacity-100 transition rounded-full shrink-0"
              aria-label="Cerrar notificación"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
