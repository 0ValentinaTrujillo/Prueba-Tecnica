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

/** Cruz: botón de crear/añadir. */
export function PlusIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

/** Tres líneas: botón de menú en móvil. */
export function MenuIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  );
}

/** Aspa: cierra el menú de móvil. */
export function CloseIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

/** Flecha simple hacia abajo: indicador de los desplegables. */
export function ChevronDownIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/** Triángulo de aviso: cabecera de los modales de confirmación. */
export function AlertIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="m10.29 3.86-8.18 14.14A1.5 1.5 0 0 0 3.4 20.2h17.2a1.5 1.5 0 0 0 1.3-2.2L13.71 3.86a1.5 1.5 0 0 0-2.6 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}
