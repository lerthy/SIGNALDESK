import { Router } from 'express';

export const healthRouter = Router();

// Used by Render's health check. Database connectivity is added with the repositories.
healthRouter.get('/', (_req, res) => {
  res.json({ data: { status: 'ok' }, error: null });
});
