import { Router } from 'express';
import type { DiscussionRepository } from '../repositories/discussions.repository.js';
import type { DraftRepository } from '../repositories/drafts.repository.js';
import type { DraftStatus } from '../schemas/draft.schema.js';

interface StatsRouterDeps {
  discussions: DiscussionRepository;
  drafts: DraftRepository;
  aiEnabled: boolean;
}

export function statsRouter({ discussions, drafts, aiEnabled }: StatsRouterDeps) {
  const router = Router();

  router.get('/', async (_req, res) => {
    const [discussionCount, allDrafts] = await Promise.all([
      discussions.countDemo(),
      drafts.list(),
    ]);

    // shortcut: counts by loading every draft, switch to a SQL count if drafts grow past a few thousand.
    const draftsByStatus: Record<DraftStatus, number> = { draft: 0, reviewed: 0, dismissed: 0 };
    for (const draft of allDrafts) draftsByStatus[draft.status] += 1;

    res.json({
      data: {
        discussions: discussionCount,
        drafts: draftsByStatus,
        aiProvider: aiEnabled ? 'groq' : 'template',
      },
      error: null,
    });
  });

  return router;
}
