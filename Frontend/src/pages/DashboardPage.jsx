import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import {
  ClockIcon,
  DoneIcon,
  InProgressIcon,
  PendingIcon,
  RefreshIcon,
  SpinnerIcon,
} from '../components/icons.jsx';

/**
 * Cada métrica tiene un color propio (barra y cifra). Vive en el CSS como
 * `--accent`, seleccionado por `[data-metric]`; aquí solo viaja la clave.
 */
const STATUS_ICON = {
  pendiente: PendingIcon,
  en_curso: InProgressIcon,
  hecho: DoneIcon,
};

const COUNT_MS = 2500;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Cuenta de 0 al valor final con desaceleración. `decimals` permite animar
 * porcentajes (33,3) sin perder el decimal por el camino.
 * Si el sistema pide menos movimiento, muestra la cifra directamente.
 */
function useCountUp(target, { decimals = 0, duration = COUNT_MS } = {}) {
  const [value, setValue] = useState(target);
  const frameRef = useRef(0);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setValue(target);
      return undefined;
    }

    const factor = 10 ** decimals;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased * factor) / factor);
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, decimals, duration]);

  return value;
}

/** 50 → "50%", 33.3 → "33,3%" (separador decimal español). */
function formatPercentage(value) {
  return `${value.toLocaleString('es-ES', { maximumFractionDigits: 1 })}%`;
}

function MetricCard({ metric, label, count, index }) {
  const animated = useCountUp(count);

  return (
    <article
      className="metric-card"
      data-metric={metric}
      style={{ '--stagger': `${index * 120}ms` }}
    >
      <span className="metric-label">{label}</span>
      <strong className="metric-value">{animated}</strong>
    </article>
  );
}

/** Identificador técnico que manda la API → texto legible para el usuario. */
const SOURCE_LABELS = {
  'aws-lambda:metrics': 'Función de métricas (AWS Lambda)',
};

function formatSource(source) {
  return SOURCE_LABELS[source] ?? source;
}

/** "16 sept 2026, 18:42" */
function formatTimestamp(value) {
  return new Date(value).toLocaleString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function Bar({ status, label, icon: Icon, percentage }) {
  const animated = useCountUp(percentage, { decimals: 1 });

  return (
    <li data-metric={status}>
      <span className="bar-label">
        <Icon className="bar-label-icon" />
        {label}
      </span>
      <span className="bar-track">
        <span className="bar-fill" style={{ '--bar-width': `${percentage}%` }} />
      </span>
      <span className="bar-value">{formatPercentage(animated)}</span>
    </li>
  );
}

export default function DashboardPage() {
  const { handleAuthError } = useAuth();
  const toast = useToast();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setMetrics(await api.metrics());
    } catch (err) {
      if (!handleAuthError(err)) toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [handleAuthError, toast]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section className="page dashboard">
      <header className="page-header">
        <div>
          <h1>Estadísticas</h1>
          <p className="page-subtitle">
            Métricas calculadas por la función AWS Lambda a partir de las notas del tablero.
          </p>
        </div>

        <button type="button" className="btn-refresh" onClick={load} disabled={loading}>
          {loading ? (
            <SpinnerIcon className="btn-refresh-icon btn-refresh-spinner" />
          ) : (
            <RefreshIcon className="btn-refresh-icon" />
          )}
          {loading ? 'Actualizando…' : 'Actualizar'}
        </button>
      </header>

      {metrics && (
        <div className="dashboard-body">
          <div className="metric-grid">
            <MetricCard metric="total" label="Notas totales" count={metrics.total} index={0} />

            {metrics.byStatus.map((item, i) => (
              <MetricCard
                key={item.status}
                metric={item.status}
                label={item.label}
                count={item.count}
                index={i + 1}
              />
            ))}
          </div>

          <article className="chart-panel" style={{ '--stagger': '600ms' }}>
            <h2 className="chart-title">Distribución por estado</h2>

            <ul className="bar-list">
              {metrics.byStatus.map((item) => (
                <Bar
                  key={item.status}
                  status={item.status}
                  label={item.label}
                  icon={STATUS_ICON[item.status]}
                  percentage={item.percentage}
                />
              ))}
            </ul>
          </article>

          <footer className="dashboard-meta">
            <ClockIcon className="dashboard-meta-icon" />
            {formatSource(metrics.source)} · actualizado {formatTimestamp(metrics.generatedAt)}
          </footer>
        </div>
      )}

      {!metrics && loading && <div className="centered-state">Cargando métricas…</div>}
      {!metrics && !loading && (
        <div className="centered-state">No se pudieron cargar las métricas.</div>
      )}
    </section>
  );
}
