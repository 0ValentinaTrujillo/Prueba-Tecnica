/**
 * Iconos en línea, dibujados al estilo de Lucide (trazo de 2px sobre una rejilla
 * de 24). Van embebidos en vez de instalar una librería de iconos: son cinco
 * trazados, heredan el color con `currentColor` y evitan sumar una dependencia
 * y ~600 kB de node_modules a la entrega.
 */
const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': 'true',
  focusable: 'false',
};

/** Equipo colaborando: identidad del portal. */
export function TeamIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

/** Reloj: notas pendientes. */
export function PendingIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

/** Flecha circular: notas en curso. */
export function InProgressIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M21 12a9 9 0 1 1-3.5-7.1" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

/** Marca de verificación: notas hechas. */
export function DoneIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.5 2.5 4.5-5" />
    </svg>
  );
}

/** Flechas de recarga: botón Actualizar. */
export function RefreshIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M21 12a9 9 0 0 1-15.5 6.2L3 16" />
      <path d="M3 12a9 9 0 0 1 15.5-6.2L21 8" />
      <path d="M21 3v5h-5M3 21v-5h5" />
    </svg>
  );
}

/** Reloj: marca de última actualización. */
export function ClockIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

/** Arco abierto que gira mientras se recargan las métricas. */
export function SpinnerIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M21 12a9 9 0 1 1-6.2-8.6" />
    </svg>
  );
}
