import { useEffect, useRef } from 'react';
import Modal from './Modal.jsx';
import { AlertIcon } from './icons.jsx';

/**
 * Modal de confirmación estándar de la app (sustituye a window.confirm).
 * Se cierra con Escape, clic en el fondo, o el botón "Cancelar".
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  danger = true,
  onConfirm,
  onCancel,
}) {
  const confirmRef = useRef(null);

  useEffect(() => {
    if (open) confirmRef.current?.focus();
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onCancel}
      role="alertdialog"
      labelledBy="confirm-dialog-title"
      describedBy="confirm-dialog-message"
    >
      <div className={`modal-icon${danger ? ' modal-icon-danger' : ''}`}>
        <AlertIcon className="modal-icon-svg" />
      </div>

      <h2 id="confirm-dialog-title" className="modal-title">
        {title}
      </h2>
      <p id="confirm-dialog-message" className="modal-message">
        {message}
      </p>

      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          {cancelLabel}
        </button>
        <button
          type="button"
          ref={confirmRef}
          className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
