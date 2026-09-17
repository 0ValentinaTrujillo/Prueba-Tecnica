// Cualquier carácter que no sea letra (incluye acentos/ñ, habituales en nombres
// en español) o espacio se descarta al vuelo: números y símbolos nunca llegan
// a aparecer en el campo.
const NON_NAME_CHARS = /[^a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s]/g;

export function sanitizeName(value) {
  return value.replace(NON_NAME_CHARS, '');
}

/** Cuántos administradores activos hay en la lista. */
export function countActiveAdmins(users) {
  return users.filter((u) => u.role === 'admin' && u.active).length;
}
