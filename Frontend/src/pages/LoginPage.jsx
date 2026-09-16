import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const DEMO_ACCOUNTS = [
  { label: 'Administrador', email: 'admin@demo.com', password: 'Admin123!' },
  { label: 'Usuario', email: 'user@demo.com', password: 'User123!' },
];

/**
 * Panel ilustrado de la tarjeta: un tablero de notas compartido, que es de lo que
 * va la aplicación. Va embebido como SVG para que el login no dependa de la red
 * (la demo se ejecuta también sin internet) y sin imágenes de terceros.
 * Es decorativo, así que queda oculto al lector de pantalla.
 */
function LoginArtwork() {
  return (
    <svg
      className="login-artwork"
      viewBox="0 0 420 620"
      preserveAspectRatio="xMidYMid slice"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="loginSky" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a2d2ff" />
          <stop offset="55%" stopColor="#7fb2e8" />
          <stop offset="100%" stopColor="#5b8fc4" />
        </linearGradient>
      </defs>

      <rect width="420" height="620" fill="url(#loginSky)" />

      {/* Formas de fondo */}
      <circle cx="60" cy="72" r="96" fill="#ffffff" opacity="0.12" />
      <circle cx="372" cy="186" r="128" fill="#cdb4db" opacity="0.22" />
      <circle cx="330" cy="560" r="104" fill="#ffffff" opacity="0.1" />

      {/* Tablero */}
      <rect x="62" y="132" width="296" height="230" rx="18" fill="#ffffff" opacity="0.96" />

      {/* Notas sobre el tablero, con los colores de la paleta */}
      <g>
        <rect x="88" y="158" width="78" height="78" rx="10" fill="#ffc8dd" />
        <rect x="100" y="176" width="52" height="7" rx="3.5" fill="#ffffff" opacity="0.85" />
        <rect x="100" y="191" width="38" height="6" rx="3" fill="#ffffff" opacity="0.7" />

        <rect x="180" y="158" width="78" height="78" rx="10" fill="#a2d2ff" />
        <rect x="192" y="176" width="52" height="7" rx="3.5" fill="#ffffff" opacity="0.85" />
        <rect x="192" y="191" width="44" height="6" rx="3" fill="#ffffff" opacity="0.7" />

        <rect x="272" y="158" width="62" height="78" rx="10" fill="#cdb4db" />
        <rect x="284" y="176" width="38" height="7" rx="3.5" fill="#ffffff" opacity="0.85" />

        <rect x="88" y="252" width="78" height="86" rx="10" fill="#ffafcc" />
        <rect x="100" y="272" width="50" height="7" rx="3.5" fill="#ffffff" opacity="0.85" />
        <rect x="100" y="287" width="34" height="6" rx="3" fill="#ffffff" opacity="0.7" />

        <rect x="180" y="252" width="154" height="86" rx="10" fill="#bde0fe" />
        <rect x="194" y="274" width="88" height="7" rx="3.5" fill="#ffffff" opacity="0.9" />
        <rect x="194" y="289" width="118" height="6" rx="3" fill="#ffffff" opacity="0.72" />
        <rect x="194" y="303" width="66" height="6" rx="3" fill="#ffffff" opacity="0.6" />
      </g>

      {/* Dos personas frente al tablero */}
      <g>
        <circle cx="146" cy="436" r="30" fill="#ffffff" opacity="0.95" />
        <path d="M100 520a46 46 0 0 1 92 0z" fill="#ffffff" opacity="0.95" />

        <circle cx="266" cy="446" r="26" fill="#ffffff" opacity="0.8" />
        <path d="M226 520a40 40 0 0 1 80 0z" fill="#ffffff" opacity="0.8" />
      </g>
    </svg>
  );
}

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

  // El fallo llega del servidor y afecta a la pareja correo/contraseña, no a un campo suelto.
  const fieldClass = `login-input${error ? ' login-input-error' : ''}`;

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-media">
          <LoginArtwork />
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <h1 className="login-title">LOGIN</h1>
          <p className="login-subtitle">
            Accede al portal de equipo: tablero, métricas y usuarios.
          </p>

          <label className="login-label" htmlFor="email">
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            className={fieldClass}
            placeholder="Correo electrónico"
            autoComplete="username"
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? 'login-error' : undefined}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label className="login-label" htmlFor="password">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            className={fieldClass}
            placeholder="Contraseña"
            autoComplete="current-password"
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? 'login-error' : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <p className="login-error" id="login-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="login-submit" disabled={submitting}>
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
    </div>
  );
}
