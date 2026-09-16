import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const EMPTY_FORM = { name: '', email: '', password: '', role: 'user' };

export default function UsersPage() {
  const { user: currentUser, handleAuthError } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'user', password: '' });

  const load = useCallback(async () => {
    try {
      const { users: list } = await api.listUsers();
      setUsers(list);
    } catch (err) {
      if (!handleAuthError(err)) setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  useEffect(() => {
    load();
  }, [load]);

  function report(err) {
    if (!handleAuthError(err)) setError(err.message);
  }

  async function handleCreate(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      const { user } = await api.createUser(form);
      setUsers((current) => [...current, user]);
      setForm(EMPTY_FORM);
      setMessage(`Usuario ${user.email} creado. Ya puede iniciar sesión con su contraseña.`);
    } catch (err) {
      report(err);
    }
  }

  function startEdit(user) {
    setEditingId(user.id);
    setEditForm({ name: user.name, email: user.email, role: user.role, password: '' });
    setError('');
    setMessage('');
  }

  async function saveEdit(id) {
    setError('');
    try {
      const payload = { name: editForm.name, email: editForm.email, role: editForm.role };
      if (editForm.password) payload.password = editForm.password;
      const { user } = await api.updateUser(id, payload);
      setUsers((current) => current.map((item) => (item.id === id ? user : item)));
      setEditingId(null);
      setMessage(`Usuario ${user.email} actualizado.`);
    } catch (err) {
      report(err);
    }
  }

  async function toggleStatus(user) {
    setError('');
    setMessage('');
    try {
      const { user: updated } = await api.setUserStatus(user.id, !user.active);
      setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      report(err);
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>Usuarios</h1>
          <p className="muted">
            Alta, edición, rol y estado. Siempre debe quedar al menos un administrador activo.
          </p>
        </div>
      </header>

      {error && <p className="form-error">{error}</p>}
      {message && <p className="form-success">{message}</p>}

      <article className="panel">
        <h2>Nuevo usuario</h2>
        <form className="inline-form" onSubmit={handleCreate}>
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
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="user">Usuario</option>
            <option value="admin">Administrador</option>
          </select>
          <button type="submit" className="btn btn-primary">
            Crear
          </button>
        </form>
      </article>

      <article className="panel">
        <h2>Listado</h2>
        {loading ? (
          <div className="centered-state">Cargando usuarios…</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th aria-label="Acciones" />
              </tr>
            </thead>
            <tbody>
              {users.map((user) =>
                editingId === user.id ? (
                  <tr key={user.id}>
                    <td>
                      <input
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      />
                    </td>
                    <td>
                      <select
                        value={editForm.role}
                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                      >
                        <option value="user">Usuario</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="password"
                        placeholder="Nueva contraseña (opcional)"
                        value={editForm.password}
                        onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                      />
                    </td>
                    <td className="row-actions">
                      <button
                        type="button"
                        className="btn btn-primary btn-small"
                        onClick={() => saveEdit(user.id)}
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-small"
                        onClick={() => setEditingId(null)}
                      >
                        Cancelar
                      </button>
                    </td>
                  </tr>
                ) : (
                  <tr key={user.id} className={user.active ? '' : 'row-inactive'}>
                    <td>
                      {user.name}
                      {user.id === currentUser.id && <span className="tag">tú</span>}
                    </td>
                    <td>{user.email}</td>
                    <td>{user.role === 'admin' ? 'Administrador' : 'Usuario'}</td>
                    <td>
                      <span className={`state state-${user.active ? 'on' : 'off'}`}>
                        {user.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="row-actions">
                      <button
                        type="button"
                        className="btn btn-ghost btn-small"
                        onClick={() => startEdit(user)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className={`btn btn-small ${user.active ? 'btn-danger' : 'btn-primary'}`}
                        onClick={() => toggleStatus(user)}
                        disabled={user.id === currentUser.id && user.active}
                        title={
                          user.id === currentUser.id && user.active
                            ? 'No puedes desactivar tu propia cuenta'
                            : undefined
                        }
                      >
                        {user.active ? 'Desactivar' : 'Reactivar'}
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}
      </article>
    </section>
  );
}
