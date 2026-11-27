import cors from 'cors';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import type { Env } from './config/env.js';
import { errorHandler } from './middleware/errors.js';
import type { DiscussionRepository } from './repositories/discussions.repository.js';
import { discussionsRouter } from './routes/discussions.js';
import { healthRouter } from './routes/health.js';

export interface AppDeps {
  env: Pick<Env, 'FRONTEND_ORIGIN'>;
  discussions: DiscussionRepository;
}

export function createApp({ env, discussions }: AppDeps) {
  const app = express();
  // Render puts one proxy in front of us; without this every client looks like the proxy's IP to the rate limiter.
  app.set('trust proxy', 1);

  app.use(helmet());
  // Browsers only call this API from the frontend origin; curl and server-to-server calls ignore CORS.
  app.use(cors({ origin: env.FRONTEND_ORIGIN }));
  app.use(express.json({ limit: '50kb' }));
  app.use(
    '/api',
    rateLimit({
      windowMs: 60_000,
      limit: 120,
      standardHeaders: true,
      legacyHeaders: false,
      message: { data: null, error: { message: 'Too many requests, slow down.' } },
    }),
  );

  app.use('/api/health', healthRouter);
  app.use('/api/discussions', discussionsRouter(discussions));

  app.use((_req, res) => {
    res.status(404).json({ data: null, error: { message: 'Route not found' } });
  });
  app.use(errorHandler);

  return app;
}
