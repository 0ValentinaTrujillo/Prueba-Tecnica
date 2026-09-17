import { useEffect, useState } from 'react';
import Modal from './Modal.jsx';
import Dropdown from './Dropdown.jsx';
import PasswordInput from './PasswordInput.jsx';
import { CloseIcon } from './icons.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { ROLE_OPTIONS } from '../constants.js';
import { sanitizeName } from '../utils.js';

const emptyForm = () => ({ name: '', email: '', password: '', role: 'user', active: true });

/** Modal de edición de usuario: nombre, correo, contraseña, rol y estado. */
export default function EditUserModal({ open, user, activeAdminCount, onClose, onSave }) {
  const toast = useToast();
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  // Se re-sincroniza cada vez que se abre para editar un usuario distinto.
  useEffect(() => {
    if (user) {
      setForm({ name: user.name, email: user.email, password: '', role: user.role, active: user.active });
    }
  }, [user]);

  function handleClose() {
    if (saving) return;
    onClose();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await onSave(user, form);
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  const isLastActiveAdmin = user?.role === 'admin' && user?.active && activeAdminCount === 1;
  const blockTitle = isLastActiveAdmin ? 'Único administrador activo' : undefined;

  return (
    <Modal open={open} onClose={handleClose} className="modal-user" labelledBy="edit-user-title">
      <div className="modal-user-header">
        <h2 id="edit-user-title" className="modal-title">
          Editar usuario
        </h2>
        <button
          type="button"
          className="modal-close"
          onClick={handleClose}
          aria-label="Cerrar"
          disabled={saving}
        >
          <CloseIcon />
        </button>
      </div>

      <form className="modal-fields" onSubmit={handleSubmit}>
        <div className="field-group">
          <div>
            <label className="field-label" htmlFor="edit-user-name">
              Nombre
            </label>
            <input
              id="edit-user-name"
              className="field-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: sanitizeName(e.target.value) })}
              required
            />
          </div>

          <div>
            <label className="field-label" htmlFor="edit-user-email">
              Correo
            </label>
            <input
              id="edit-user-email"
              className="field-input"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="field-label" htmlFor="edit-user-password">
              Nueva contraseña
            </label>
            <PasswordInput
              id="edit-user-password"
              className="field-input"
              placeholder="Dejar en blanco para no cambiarla"
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <div>
            <label className="field-label">Rol</label>
            <Dropdown
              value={form.role}
              options={ROLE_OPTIONS}
              onChange={(role) => setForm({ ...form, role })}
              ariaLabel="Rol del usuario"
            />
          </div>

          <div>
            <span className="field-label">Estado</span>
            <label className="field-checkbox" title={blockTitle}>
              <input
                type="checkbox"
                checked={form.active}
                disabled={isLastActiveAdmin}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              Activo
            </label>
          </div>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-logout" onClick={handleClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-accent" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
