import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.corsOrigin === '*' ? true : env.corsOrigin.split(',') }));
  app.use(express.json({ limit: '100kb' }));

  app.use('/api', routes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
