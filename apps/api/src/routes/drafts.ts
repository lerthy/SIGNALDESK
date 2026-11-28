import { Router } from 'express';
import { HttpError } from '../middleware/errors.js';
import { createRateLimiter } from '../middleware/rateLimit.js';
import type { DiscussionRepository } from '../repositories/discussions.repository.js';
import type { DraftRepository } from '../repositories/drafts.repository.js';
import {
  createDraftSchema,
  generateRequestSchema,
  idParamSchema,
  updateDraftSchema,
} from '../schemas/draft.schema.js';
import { assertDraftEligible, generateDraft } from '../services/draft.service.js';
import type { AiProvider } from '../types/draft.js';

// The demo has no login, so drafts get a tighter limit than the rest of the API to slow down abuse.
const DRAFTS_LIMIT_PER_MINUTE = 30;
// Stricter again: each generate call can cost an AI request.
const GENERATE_LIMIT_PER_MINUTE = 10;

interface DraftsRouterDeps {
  discussions: DiscussionRepository;
  drafts: DraftRepository;
  ai: AiProvider | null;
}

// Nothing here sends anything anywhere: drafts are only stored for a person to review.
export function draftsRouter({ discussions, drafts, ai }: DraftsRouterDeps) {
  const router = Router();
  router.use(createRateLimiter(DRAFTS_LIMIT_PER_MINUTE));

  router.post('/generate', createRateLimiter(GENERATE_LIMIT_PER_MINUTE), async (req, res) => {
    const { discussionId, tone } = generateRequestSchema.parse(req.body);

    const discussion = await discussions.findDemoById(discussionId);
    if (!discussion) throw new HttpError(404, 'Discussion not found');

    res.json({ data: await generateDraft(ai, discussion, tone), error: null });
  });

  router.get('/', async (_req, res) => {
    res.json({ data: await drafts.list(), error: null });
  });

  router.post('/', async (req, res) => {
    const newDraft = createDraftSchema.parse(req.body);

    const discussion = await discussions.findDemoById(newDraft.discussionId);
    if (!discussion) throw new HttpError(404, 'Discussion not found');
    assertDraftEligible(discussion);

    res.status(201).json({ data: await drafts.create(newDraft), error: null });
  });

  router.patch('/:id', async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const changes = updateDraftSchema.parse(req.body);

    const draft = await drafts.update(id, changes);
    if (!draft) throw new HttpError(404, 'Draft not found');
    res.json({ data: draft, error: null });
  });

  router.delete('/:id', async (req, res) => {
    const { id } = idParamSchema.parse(req.params);

    if (!(await drafts.remove(id))) throw new HttpError(404, 'Draft not found');
    res.json({ data: { id }, error: null });
  });

  return router;
}
