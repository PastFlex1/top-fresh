import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, XCircle, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-lg border ${
                toast.type === 'success' 
                  ? 'bg-white border-green-200 text-green-800' 
                  : toast.type === 'error'
                  ? 'bg-white border-red-200 text-red-800'
                  : 'bg-white border-yellow-200 text-yellow-800'
              }`}
            >
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />}
              {toast.type === 'error' && <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />}
              {toast.type === 'warning' && <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />}
              
              <p className="flex-1 text-sm font-bold text-[#1c1a17] leading-relaxed">
                {toast.message}
              </p>
              
              <button 
                onClick={() => removeToast(toast.id)}
                className="text-[#878077] hover:text-[#1c1a17] transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
