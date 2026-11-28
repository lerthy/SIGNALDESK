import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import type { Env } from './config/env.js';
import { errorHandler } from './middleware/errors.js';
import { createRateLimiter } from './middleware/rateLimit.js';
import type { DiscussionRepository } from './repositories/discussions.repository.js';
import { discussionsRouter } from './routes/discussions.js';
import { draftsRouter } from './routes/drafts.js';
import { healthRouter } from './routes/health.js';
import type { AiProvider } from './types/draft.js';

const GLOBAL_LIMIT_PER_MINUTE = 120;

export interface AppDeps {
  env: Pick<Env, 'FRONTEND_ORIGIN'>;
  discussions: DiscussionRepository;
  /** Null means no API key is configured: drafts come from the template fallback. */
  ai: AiProvider | null;
}

export function createApp({ env, discussions, ai }: AppDeps) {
  const app = express();
  // Render puts one proxy in front of us; without this every client looks like the proxy's IP to the rate limiter.
  app.set('trust proxy', 1);

  app.use(helmet());
  // Browsers only call this API from the frontend origin; curl and server-to-server calls ignore CORS.
  app.use(cors({ origin: env.FRONTEND_ORIGIN }));
  app.use(express.json({ limit: '50kb' }));
  app.use('/api', createRateLimiter(GLOBAL_LIMIT_PER_MINUTE));

  app.use('/api/health', healthRouter);
  app.use('/api/discussions', discussionsRouter(discussions));
  app.use('/api/drafts', draftsRouter(discussions, ai));

  app.use((_req, res) => {
    res.status(404).json({ data: null, error: { message: 'Route not found' } });
  });
  app.use(errorHandler);

  return app;
}
