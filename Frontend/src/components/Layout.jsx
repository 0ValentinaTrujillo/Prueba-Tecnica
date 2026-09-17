import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { TeamIcon, MenuIcon, CloseIcon } from './icons.jsx';

const ROLE_LABEL = { admin: 'Administrador', user: 'Usuario' };

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Al cambiar de página el menú móvil se cierra solo.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <TeamIcon className="brand-mark" />
          Portal de equipo
        </div>

        <button
          type="button"
          className="nav-toggle"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>

        <div className={`app-header-collapse${menuOpen ? ' is-open' : ''}`}>
          <nav className="app-nav">
            <NavLink to="/dashboard">Dashboard</NavLink>
            <NavLink to="/tablero">Tablero</NavLink>
            {isAdmin && <NavLink to="/usuarios">Usuarios</NavLink>}
          </nav>

          <div className="session">
            <span className="session-user">
              {user.name}
              <small>{ROLE_LABEL[user.role]}</small>
            </span>
            <button type="button" className="btn-logout" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
