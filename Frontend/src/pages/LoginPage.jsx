import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const DEMO_ACCOUNTS = [
  { label: 'Administrador', email: 'admin@demo.com', password: 'Admin123!' },
  { label: 'Usuario', email: 'user@demo.com', password: 'User123!' },
];

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <div className="centered-state">Cargando…</div>;
  if (user) return <Navigate to={location.state?.from ?? '/dashboard'} replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(location.state?.from ?? '/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function useDemoAccount(account) {
    setEmail(account.email);
    setPassword(account.password);
    setError('');
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Portal de equipo</h1>
        <p className="muted">Inicia sesión para acceder al tablero y al dashboard.</p>

        <label htmlFor="email">Correo electrónico</label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Entrando…' : 'Iniciar sesión'}
        </button>

        <div className="demo-accounts">
          <span className="muted">Cuentas de demostración:</span>
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              type="button"
              className="btn btn-ghost btn-small"
              onClick={() => useDemoAccount(account)}
            >
              {account.label} · {account.email}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
}
