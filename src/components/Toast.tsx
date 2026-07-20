import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  notify: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const COLORS: Record<ToastType, { bg: string; fg: string; icon: string }> = {
  success: { bg: '#1e8e3e', fg: '#fff', icon: '✓' },
  error: { bg: '#d93025', fg: '#fff', icon: '✕' },
  info: { bg: '#1a73e8', fg: '#fff', icon: 'i' },
  warning: { bg: '#f9ab00', fg: '#202124', icon: '!' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const notify = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const value: ToastContextValue = {
    notify,
    success: (m) => notify(m, 'success'),
    error: (m) => notify(m, 'error'),
    info: (m) => notify(m, 'info'),
    warning: (m) => notify(m, 'warning'),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          zIndex: 9999,
          alignItems: 'center',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => {
          const c = COLORS[t.type];
          return (
            <div
              key={t.id}
              role="alert"
              style={{
                background: c.bg,
                color: c.fg,
                padding: '14px 18px',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 500,
                fontFamily: 'Roboto, "Segoe UI", system-ui, sans-serif',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                boxShadow: '0 3px 10px rgba(0,0,0,0.25)',
                minWidth: 220,
                maxWidth: '90vw',
                direction: 'rtl',
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.25)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {c.icon}
              </span>
              <span>{t.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}

// Standalone helper for non-React modules (e.g. services/api.ts)
let externalNotify: ((message: string, type?: ToastType) => void) | null = null;

export function setExternalNotify(fn: (message: string, type?: ToastType) => void) {
  externalNotify = fn;
}

export function notify(message: string, type: ToastType = 'info') {
  if (externalNotify) externalNotify(message, type);
  else alert(message);
}
