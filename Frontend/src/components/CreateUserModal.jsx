import { useState } from 'react';
import Modal from './Modal.jsx';

const EMPTY_FORM = { name: '', email: '', password: '', role: 'user' };

/** Modal de alta de usuario: misma estructura que ConfirmDialog, con un formulario. */
export default function CreateUserModal({ open, onClose, onCreate }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function handleClose() {
    if (saving) return;
    setForm(EMPTY_FORM);
    setError('');
    onClose();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onCreate(form);
      setForm(EMPTY_FORM);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} labelledBy="create-user-title">
      <h2 id="create-user-title" className="modal-title">
        Nuevo usuario
      </h2>
      <p className="modal-message">
        Queda activo de inmediato y puede iniciar sesión con la contraseña que definas.
      </p>

      <form className="modal-fields" onSubmit={handleSubmit}>
        {error && <p className="form-error">{error}</p>}

        <input
          placeholder="Nombre"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          type="email"
          placeholder="Correo electrónico"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Contraseña (mín. 8)"
          minLength={8}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option value="user">Usuario</option>
          <option value="admin">Administrador</option>
        </select>

        <div className="modal-actions">
          <button type="button" className="btn btn-logout" onClick={handleClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-accent" disabled={saving}>
            {saving ? 'Creando…' : 'Crear'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
