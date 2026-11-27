import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import type { Env } from './config/env.js';
import { healthRouter } from './routes/health.js';

export function createApp(env: Pick<Env, 'FRONTEND_ORIGIN'>) {
  const app = express();

  app.use(helmet());
  // Browsers only call this API from the frontend origin; curl and server-to-server calls ignore CORS.
  app.use(cors({ origin: env.FRONTEND_ORIGIN }));
  app.use(express.json({ limit: '50kb' }));

  app.use('/api/health', healthRouter);

  app.use((_req, res) => {
    res.status(404).json({ data: null, error: { message: 'Route not found' } });
  });

  return app;
}
