const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';
const TOKEN_KEY = 'team-portal-token';

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const token = tokenStorage.get();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 204) return null;

  const raw = await response.text();
  const data = raw ? JSON.parse(raw) : null;

  if (!response.ok) {
    throw new ApiError(response.status, data?.error ?? 'Error inesperado');
  }
  return data;
}

export const api = {
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: { email, password }, auth: false }),
  me: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),

  listUsers: () => request('/users'),
  createUser: (payload) => request('/users', { method: 'POST', body: payload }),
  updateUser: (id, payload) => request(`/users/${id}`, { method: 'PUT', body: payload }),
  setUserStatus: (id, active) =>
    request(`/users/${id}/status`, { method: 'PATCH', body: { active } }),

  listNotes: () => request('/notes'),
  createNote: (payload) => request('/notes', { method: 'POST', body: payload }),
  updateNote: (id, payload) => request(`/notes/${id}`, { method: 'PUT', body: payload }),
  moveNote: (id, position) =>
    request(`/notes/${id}/position`, { method: 'PATCH', body: { position } }),
  deleteNote: (id) => request(`/notes/${id}`, { method: 'DELETE' }),

  metrics: () => request('/dashboard/metrics'),
};
