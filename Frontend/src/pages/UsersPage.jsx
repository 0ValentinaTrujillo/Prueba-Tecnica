import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import CreateUserModal from '../components/CreateUserModal.jsx';
import Pagination from '../components/Pagination.jsx';
import { PlusIcon } from '../components/icons.jsx';

const PAGE_SIZE = 10;

export default function UsersPage() {
  const { user: currentUser, handleAuthError } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'user', password: '' });

  const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE));
  const pagedUsers = users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Si la página actual queda vacía (p. ej. tras borrar el último usuario de la última página), retrocede.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

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

  async function handleCreateUser(payload) {
    setError('');
    setMessage('');
    try {
      const { user } = await api.createUser(payload);
      setUsers((current) => [...current, user]);
      setMessage(`Usuario ${user.email} creado. Ya puede iniciar sesión con su contraseña.`);
    } catch (err) {
      if (handleAuthError(err)) return;
      throw err;
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

        <div className="page-actions">
          <button type="button" className="btn-refresh" onClick={() => setCreateOpen(true)}>
            <PlusIcon className="btn-refresh-icon" />
            Crear
          </button>
        </div>
      </header>

      {error && <p className="form-error">{error}</p>}
      {message && <p className="form-success">{message}</p>}

      <article>
        {loading ? (
          <div className="centered-state">Cargando usuarios…</div>
        ) : (
          <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pagedUsers.map((user) =>
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
          </div>
        )}

        {!loading && users.length > 0 && (
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={users.length}
            onPageChange={setPage}
            label="usuarios"
          />
        )}
      </article>

      <CreateUserModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreateUser}
      />
    </section>
  );
}
