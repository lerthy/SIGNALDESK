import { Router } from 'express';
import { HttpError } from '../middleware/errors.js';
import type { DiscussionRepository } from '../repositories/discussions.repository.js';
import { searchQuerySchema } from '../schemas/search.schema.js';
import { searchDiscussions } from '../services/search.js';

export function discussionsRouter(repo: DiscussionRepository) {
  const router = Router();

  router.get('/', async (req, res) => {
    const { query, source } = searchQuerySchema.parse(req.query);
    if (source === 'bluesky') throw new HttpError(503, 'Bluesky search is not available yet.');

    const discussions = await repo.listDemo();
    res.json({ data: searchDiscussions(discussions, query), error: null });
  });

  return router;
}
