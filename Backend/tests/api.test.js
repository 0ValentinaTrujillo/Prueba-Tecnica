/**
 * Pruebas de humo de la API contra un MongoDB en memoria.
 * Ejecutar con: npm test
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { MongoMemoryServer } from 'mongodb-memory-server';

// La configuración se lee al importar, así que se prepara antes de los imports dinámicos.
const mongo = await MongoMemoryServer.create();
process.env.MONGODB_URI = mongo.getUri('team_portal_test');
process.env.JWT_SECRET = 'test-secret-para-las-pruebas';
process.env.DEMO_ADMIN_PASSWORD = 'Admin123!';
process.env.DEMO_USER_PASSWORD = 'User123!';

// Lambda de métricas simulada: responde como el Runtime Interface Emulator.
const fakeLambda = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.end(
    JSON.stringify({
      statusCode: 200,
      body: JSON.stringify({ total: 3, byStatus: [], source: 'fake-lambda' }),
    })
  );
});
await new Promise((resolve) => fakeLambda.listen(0, '127.0.0.1', resolve));
process.env.LAMBDA_METRICS_URL = `http://127.0.0.1:${fakeLambda.address().port}/invocations`;

const { createApp } = await import('../src/app.js');
const { connectDatabase, disconnectDatabase } = await import('../src/config/db.js');
const { runSeed } = await import('../src/seed/seed.js');

await connectDatabase();
await runSeed();

const server = createApp().listen(0);
await new Promise((resolve) => server.once('listening', resolve));
const base = `http://127.0.0.1:${server.address().port}/api`;

async function call(path, { method = 'GET', body, token } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const raw = await response.text();
  return { status: response.status, data: raw ? JSON.parse(raw) : null };
}

const login = async (email, password) => call('/auth/login', {
  method: 'POST',
  body: { email, password },
});

test.after(async () => {
  server.close();
  fakeLambda.close();
  await disconnectDatabase();
  await mongo.stop();
});

test('el seed crea las cuentas de demostración y ambas inician sesión', async () => {
  const admin = await login('admin@demo.com', 'Admin123!');
  const user = await login('user@demo.com', 'User123!');

  assert.equal(admin.status, 200);
  assert.equal(admin.data.user.role, 'admin');
  assert.equal(user.status, 200);
  assert.equal(user.data.user.role, 'user');
  assert.ok(admin.data.token);
});

test('rechaza credenciales incorrectas', async () => {
  const { status } = await login('admin@demo.com', 'incorrecta');
  assert.equal(status, 401);
});

test('el área autenticada exige token', async () => {
  const { status } = await call('/notes');
  assert.equal(status, 401);
});

test('solo el administrador gestiona usuarios', async () => {
  const { data: user } = await login('user@demo.com', 'User123!');
  const { status } = await call('/users', { token: user.token });
  assert.equal(status, 403);

  const { data: admin } = await login('admin@demo.com', 'Admin123!');
  const listed = await call('/users', { token: admin.token });
  assert.equal(listed.status, 200);
  assert.ok(listed.data.users.length >= 2);
});

test('un usuario creado desde la aplicación puede iniciar sesión', async () => {
  const { data: admin } = await login('admin@demo.com', 'Admin123!');

  const created = await call('/users', {
    method: 'POST',
    token: admin.token,
    body: { name: 'Nuevo', email: 'nuevo@demo.com', password: 'Nuevo123!', role: 'user' },
  });
  assert.equal(created.status, 201);

  const session = await login('nuevo@demo.com', 'Nuevo123!');
  assert.equal(session.status, 200);
});

test('un usuario desactivado pierde el acceso', async () => {
  const { data: admin } = await login('admin@demo.com', 'Admin123!');
  const { data: victim } = await login('nuevo@demo.com', 'Nuevo123!');

  const disabled = await call(`/users/${victim.user.id}/status`, {
    method: 'PATCH',
    token: admin.token,
    body: { active: false },
  });
  assert.equal(disabled.status, 200);
  assert.equal(disabled.data.user.active, false);

  // Ni con el token que ya tenía, ni volviendo a iniciar sesión.
  const withOldToken = await call('/notes', { token: victim.token });
  assert.equal(withOldToken.status, 403);

  const relogin = await login('nuevo@demo.com', 'Nuevo123!');
  assert.equal(relogin.status, 403);

  // Y se puede reactivar.
  const enabled = await call(`/users/${victim.user.id}/status`, {
    method: 'PATCH',
    token: admin.token,
    body: { active: true },
  });
  assert.equal(enabled.data.user.active, true);
});

test('siempre queda al menos un administrador activo', async () => {
  const { data: admin } = await login('admin@demo.com', 'Admin123!');

  // Otro administrador para poder intentar desactivar al primero.
  const second = await call('/users', {
    method: 'POST',
    token: admin.token,
    body: { name: 'Admin 2', email: 'admin2@demo.com', password: 'Admin456!', role: 'admin' },
  });
  assert.equal(second.status, 201);

  const { data: admin2 } = await login('admin2@demo.com', 'Admin456!');

  // admin2 desactiva al primer administrador: permitido, aún queda uno activo.
  const off = await call(`/users/${admin.user.id}/status`, {
    method: 'PATCH',
    token: admin2.token,
    body: { active: false },
  });
  assert.equal(off.status, 200);

  // Pero no puede degradarse a sí mismo: sería quedarse sin administración.
  const demote = await call(`/users/${admin2.user.id}`, {
    method: 'PUT',
    token: admin2.token,
    body: { role: 'user' },
  });
  assert.equal(demote.status, 409);

  // Ni desactivar su propia cuenta.
  const self = await call(`/users/${admin2.user.id}/status`, {
    method: 'PATCH',
    token: admin2.token,
    body: { active: false },
  });
  assert.equal(self.status, 409);

  // Se restaura el estado inicial.
  await call(`/users/${admin.user.id}/status`, {
    method: 'PATCH',
    token: admin2.token,
    body: { active: true },
  });
});

test('ciclo completo de una nota: crear, editar, mover y eliminar', async () => {
  const { data: user } = await login('user@demo.com', 'User123!');
  const token = user.token;

  const created = await call('/notes', {
    method: 'POST',
    token,
    body: { title: 'Prueba', text: 'contenido', position: { x: 10, y: 20 } },
  });
  assert.equal(created.status, 201);
  assert.equal(created.data.note.status, 'pendiente');

  const id = created.data.note.id;

  const updated = await call(`/notes/${id}`, {
    method: 'PUT',
    token,
    body: { title: 'Prueba editada', text: 'nuevo texto', status: 'en_curso' },
  });
  assert.equal(updated.data.note.title, 'Prueba editada');
  assert.equal(updated.data.note.status, 'en_curso');

  const moved = await call(`/notes/${id}/position`, {
    method: 'PATCH',
    token,
    body: { position: { x: 300, y: 450 } },
  });
  assert.deepEqual(moved.data.note.position, { x: 300, y: 450 });

  // La posición persiste: se vuelve a leer desde la base de datos.
  const listed = await call('/notes', { token });
  const reloaded = listed.data.notes.find((note) => note.id === id);
  assert.deepEqual(reloaded.position, { x: 300, y: 450 });
  assert.equal(reloaded.status, 'en_curso');

  const removed = await call(`/notes/${id}`, { method: 'DELETE', token });
  assert.equal(removed.status, 204);

  const after = await call('/notes', { token });
  assert.equal(after.data.notes.some((note) => note.id === id), false);
});

test('rechaza un estado de nota no válido', async () => {
  const { data: user } = await login('user@demo.com', 'User123!');
  const { status } = await call('/notes', {
    method: 'POST',
    token: user.token,
    body: { title: 'x', status: 'archivada' },
  });
  assert.equal(status, 422);
});

test('las métricas del dashboard llegan desde la Lambda', async () => {
  const { data: user } = await login('user@demo.com', 'User123!');
  const { status, data } = await call('/dashboard/metrics', { token: user.token });
  assert.equal(status, 200);
  assert.equal(data.source, 'fake-lambda');
  assert.equal(data.total, 3);
});
