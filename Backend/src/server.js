import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDatabase } from './config/db.js';
import { runSeed } from './seed/seed.js';

async function start() {
  await connectDatabase();
  console.log('[api] conectado a MongoDB');

  if (env.seedOnStart) {
    const result = await runSeed();
    console.log('[api] seed:', result.summary);
  }

  createApp().listen(env.port, () => {
    console.log(`[api] escuchando en http://0.0.0.0:${env.port}`);
  });
}

start().catch((error) => {
  console.error('[api] no se pudo arrancar:', error);
  process.exit(1);
});
