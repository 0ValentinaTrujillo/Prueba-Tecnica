/**
 * Prueba de la función Lambda de métricas contra un MongoDB en memoria.
 * Usa exactamente el mismo handler que se ejecuta en el contenedor y en AWS.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

const mongo = await MongoMemoryServer.create();
process.env.MONGODB_URI = mongo.getUri('metrics_test');

await mongoose.connect(process.env.MONGODB_URI);
await mongoose.connection.db.collection('notes').insertMany([
  { title: 'a', status: 'pendiente' },
  { title: 'b', status: 'pendiente' },
  { title: 'c', status: 'en_curso' },
  { title: 'd', status: 'hecho' },
]);

const { handler, closeConnection } = await import('../../Lambda/metrics/index.mjs');

test.after(async () => {
  await closeConnection();
  await mongoose.disconnect();
  await mongo.stop();
});

test('calcula el total y la distribución por estado', async () => {
  const response = await handler();
  assert.equal(response.statusCode, 200);

  const body = JSON.parse(response.body);
  assert.equal(body.total, 4);
  assert.equal(body.source, 'aws-lambda:metrics');

  const byStatus = Object.fromEntries(body.byStatus.map((item) => [item.status, item.count]));
  assert.deepEqual(byStatus, { pendiente: 2, en_curso: 1, hecho: 1 });

  const pendiente = body.byStatus.find((item) => item.status === 'pendiente');
  assert.equal(pendiente.label, 'Pendiente');
  assert.equal(pendiente.percentage, 50);
});
