import { Router } from 'express';
import { HttpError } from '../middleware/errors.js';
import { createRateLimiter } from '../middleware/rateLimit.js';
import type { DiscussionRepository } from '../repositories/discussions.repository.js';
import { generateRequestSchema } from '../schemas/draft.schema.js';
import { generateDraft } from '../services/draft.service.js';
import type { AiProvider } from '../types/draft.js';

// Stricter than the global limit: each call can cost an AI request.
const GENERATE_LIMIT_PER_MINUTE = 10;

export function draftsRouter(discussions: DiscussionRepository, ai: AiProvider | null) {
  const router = Router();

  router.post('/generate', createRateLimiter(GENERATE_LIMIT_PER_MINUTE), async (req, res) => {
    const { discussionId, tone } = generateRequestSchema.parse(req.body);

    const discussion = await discussions.findDemoById(discussionId);
    if (!discussion) throw new HttpError(404, 'Discussion not found');

    res.json({ data: await generateDraft(ai, discussion, tone), error: null });
  });

  return router;
}
