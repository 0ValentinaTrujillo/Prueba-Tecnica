import { useToastList } from '../context/ToastContext.jsx';
import { CloseIcon } from './icons.jsx';

/** Notificaciones flotantes, esquina superior derecha. Vive una vez en la raíz de la app. */
export default function ToastContainer() {
  const { toasts, dismiss } = useToastList();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}${t.closing ? ' is-closing' : ''}`}>
          <span className="toast-message">{t.message}</span>
          <button
            type="button"
            className="toast-close"
            aria-label="Cerrar notificación"
            onClick={() => dismiss(t.id)}
          >
            <CloseIcon />
          </button>
        </div>
      ))}
    </div>
  );
}
