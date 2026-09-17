export const NOTE_STATUSES = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_curso', label: 'En curso' },
  { value: 'hecho', label: 'Hecho' },
];

export const ROLE_OPTIONS = [
  { value: 'user', label: 'Usuario' },
  { value: 'admin', label: 'Administrador' },
];

// Paleta pastel del tablero. Al crear una nota se elige un color al azar.
export const NOTE_COLORS = [
  '#cdb4db', // púrpura
  '#ffc8dd', // rosado claro
  '#ffafcc', // rosado medio
  '#bde0fe', // azul claro
  '#a2d2ff', // azul más claro
];

/** Color por defecto cuando una nota llega sin color. */
export const DEFAULT_NOTE_COLOR = NOTE_COLORS[0];
