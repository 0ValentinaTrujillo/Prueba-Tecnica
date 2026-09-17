import { useEffect } from 'react';

/**
 * Cascarón estándar de modal de la app: fondo, tarjeta centrada, animación de
 * entrada, cierre con Escape o clic fuera. Lo usan ConfirmDialog y los
 * modales de formulario (p. ej. crear usuario) para lucir siempre igual.
 */
export default function Modal({
  open,
  onClose,
  role = 'dialog',
  labelledBy,
  describedBy,
  className = '',
  children,
}) {
  useEffect(() => {
    if (!open) return undefined;

    function onKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className={`modal${className ? ` ${className}` : ''}`}
        role={role}
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
