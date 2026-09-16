import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const STATUS_COLOR = {
  pendiente: '#f4a261',
  en_curso: '#4d96ff',
  hecho: '#2a9d8f',
};

export default function DashboardPage() {
  const { handleAuthError } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setMetrics(await api.metrics());
    } catch (err) {
      if (!handleAuthError(err)) setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">
            Métricas calculadas por la función AWS Lambda a partir de las notas del tablero.
          </p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={load} disabled={loading}>
          {loading ? 'Actualizando…' : 'Actualizar'}
        </button>
      </header>

      {error && <p className="form-error">{error}</p>}

      {metrics && (
        <>
          <div className="metric-grid">
            <article className="metric-card metric-card-total">
              <span className="metric-label">Notas totales</span>
              <strong className="metric-value">{metrics.total}</strong>
            </article>

            {metrics.byStatus.map((item) => (
              <article key={item.status} className="metric-card">
                <span className="metric-label">{item.label}</span>
                <strong className="metric-value" style={{ color: STATUS_COLOR[item.status] }}>
                  {item.count}
                </strong>
                <span className="muted">{item.percentage}% del total</span>
              </article>
            ))}
          </div>

          <article className="panel">
            <h2>Distribución por estado</h2>
            <ul className="bar-list">
              {metrics.byStatus.map((item) => (
                <li key={item.status}>
                  <span className="bar-label">{item.label}</span>
                  <span className="bar-track">
                    <span
                      className="bar-fill"
                      style={{
                        width: `${metrics.total === 0 ? 0 : (item.count / metrics.total) * 100}%`,
                        background: STATUS_COLOR[item.status],
                      }}
                    />
                  </span>
                  <span className="bar-value">{item.count}</span>
                </li>
              ))}
            </ul>
            <footer className="panel-footer muted">
              Origen: {metrics.source} · Generado:{' '}
              {new Date(metrics.generatedAt).toLocaleString('es-ES')}
            </footer>
          </article>
        </>
      )}

      {!metrics && loading && <div className="centered-state">Cargando métricas…</div>}
    </section>
  );
}
