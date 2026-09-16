import { MongoClient } from 'mongodb';

const STATUSES = ['pendiente', 'en_curso', 'hecho'];
const LABELS = { pendiente: 'Pendiente', en_curso: 'En curso', hecho: 'Hecho' };

// La conexión se reutiliza entre invocaciones mientras el contenedor siga caliente.
let clientPromise = null;

function getClient() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Falta la variable de entorno MONGODB_URI');
  if (!clientPromise) {
    clientPromise = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 }).connect();
  }
  return clientPromise;
}

/** Cierra la conexión cacheada. Solo lo usan las pruebas; en AWS el runtime la recicla. */
export async function closeConnection() {
  if (!clientPromise) return;
  const client = await clientPromise;
  clientPromise = null;
  await client.close();
}

function response(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

/**
 * Métricas del dashboard: total de notas y distribución por estado.
 * Se calcula con una agregación en MongoDB para no traer las notas a memoria.
 */
export const handler = async () => {
  try {
    const client = await getClient();
    const db = client.db(process.env.MONGODB_DB || undefined);
    const collection = db.collection('notes');

    const grouped = await collection
      .aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
      .toArray();

    const counts = Object.fromEntries(STATUSES.map((status) => [status, 0]));
    let total = 0;
    for (const row of grouped) {
      if (row._id in counts) counts[row._id] = row.count;
      total += row.count;
    }

    return response(200, {
      total,
      byStatus: STATUSES.map((status) => ({
        status,
        label: LABELS[status],
        count: counts[status],
        percentage: total === 0 ? 0 : Math.round((counts[status] / total) * 1000) / 10,
      })),
      generatedAt: new Date().toISOString(),
      source: 'aws-lambda:metrics',
    });
  } catch (error) {
    console.error('[metrics] error:', error);
    return response(500, { error: `No se pudieron calcular las métricas: ${error.message}` });
  }
};
