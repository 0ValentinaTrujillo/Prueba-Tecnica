/**
 * Paginación + conteo de resultados, en un solo componente reutilizable.
 * "Mostrando X-Y de Z" a la izquierda, Anterior/Siguiente a la derecha.
 */
export default function Pagination({ page, pageSize, total, onPageChange, label = 'resultados' }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="pagination">
      <p className="pagination-count">
        Mostrando <strong>{start}</strong> a <strong>{end}</strong> de <strong>{total}</strong> {label}
      </p>

      <div className="pagination-nav">
        <button
          type="button"
          className="btn btn-ghost btn-small"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Anterior
        </button>
        <span className="pagination-page">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          className="btn btn-ghost btn-small"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
