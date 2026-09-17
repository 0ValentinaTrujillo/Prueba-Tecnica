import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);

const EXIT_MS = 300;
let nextId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  // Deja que la animación de salida (300ms) termine antes de sacarlo del DOM.
  const dismiss = useCallback((id) => {
    setToasts((current) => current.map((t) => (t.id === id ? { ...t, closing: true } : t)));
    setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, EXIT_MS);
  }, []);

  const show = useCallback(
    (type, message, duration = 3000) => {
      const id = ++nextId;
      setToasts((current) => [...current, { id, type, message, closing: false }]);
      if (duration > 0) setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  const toast = useMemo(
    () => ({
      success: (message) => show('success', message),
      error: (message) => show('error', message),
      info: (message) => show('info', message),
      warning: (message) => show('warning', message),
    }),
    [show]
  );

  const value = useMemo(() => ({ toasts, toast, dismiss }), [toasts, toast, dismiss]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

/** Para disparar notificaciones: const toast = useToast(); toast.success('Listo'). */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>');
  return ctx.toast;
}

/** Para el contenedor visual: la lista activa + cómo cerrarlas. */
export function useToastList() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToastList debe usarse dentro de <ToastProvider>');
  return ctx;
}
