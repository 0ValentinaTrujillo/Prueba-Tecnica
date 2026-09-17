import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import CreateUserModal from '../components/CreateUserModal.jsx';
import EditUserModal from '../components/EditUserModal.jsx';
import Pagination from '../components/Pagination.jsx';
import { PlusIcon } from '../components/icons.jsx';
import { countActiveAdmins } from '../utils.js';

const PAGE_SIZE = 10;
const LAST_ADMIN_MESSAGE = 'No puedes desactivar el último administrador';

export default function UsersPage() {
  const { user: currentUser, handleAuthError } = useAuth();
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [page, setPage] = useState(1);

  const activeAdminCount = useMemo(() => countActiveAdmins(users), [users]);
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
      if (!handleAuthError(err)) toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [handleAuthError, toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreateUser(payload) {
    try {
      const { user } = await api.createUser(payload);
      setUsers((current) => [...current, user]);
      toast.success(`Usuario ${user.email} creado.`);
    } catch (err) {
      if (handleAuthError(err)) return;
      throw err;
    }
  }

  /** El backend ya lo bloquea, pero se valida antes de llamar a la API para no
   *  gastar una petición y para poder avisar al instante con un toast. */
  function isLastActiveAdmin(user) {
    return user.role === 'admin' && user.active && activeAdminCount <= 1;
  }

  // El nombre/correo/rol/contraseña van por PUT /users/:id; el estado activo
  // es un endpoint aparte (PATCH /users/:id/status), así que "Guardar" puede
  // encadenar ambas llamadas cuando el checkbox de Estado cambió.
  async function handleSaveEditUser(user, form) {
    if (form.active === false && isLastActiveAdmin(user)) {
      toast.error(LAST_ADMIN_MESSAGE);
      return;
    }
    try {
      const payload = { name: form.name, email: form.email, role: form.role };
      if (form.password) payload.password = form.password;
      const { user: updated } = await api.updateUser(user.id, payload);

      let finalUser = updated;
      if (form.active !== user.active) {
        const { user: statusUpdated } = await api.setUserStatus(user.id, form.active);
        finalUser = statusUpdated;
      }

      setUsers((current) => current.map((item) => (item.id === finalUser.id ? finalUser : item)));
      toast.success('Usuario actualizado.');
    } catch (err) {
      if (handleAuthError(err)) return;
      throw err;
    }
  }

  async function toggleStatus(user) {
    if (user.active && isLastActiveAdmin(user)) {
      toast.error(LAST_ADMIN_MESSAGE);
      return;
    }
    try {
      const { user: updated } = await api.setUserStatus(user.id, !user.active);
      setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      if (!handleAuthError(err)) toast.error(err.message);
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

      <article className="table-block">
        {loading ? (
          <div className="centered-state">Cargando usuarios…</div>
        ) : (
          <div className="table-wrapper">
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
              {pagedUsers.map((user) => {
                const blockDeactivate = isLastActiveAdmin(user);

                return (
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
                        className="btn btn-logout btn-small"
                        onClick={() => setEditingUser(user)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className={`btn btn-small ${
                          blockDeactivate ? 'btn-muted' : user.active ? 'btn-danger' : 'btn-accent'
                        }`}
                        onClick={() => toggleStatus(user)}
                        disabled={blockDeactivate}
                        title={blockDeactivate ? 'Único administrador activo' : undefined}
                      >
                        {user.active ? 'Desactivar' : 'Reactivar'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
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

      <EditUserModal
        open={editingUser !== null}
        user={editingUser}
        activeAdminCount={activeAdminCount}
        onClose={() => setEditingUser(null)}
        onSave={handleSaveEditUser}
      />
    </section>
  );
}
