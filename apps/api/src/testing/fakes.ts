import { randomUUID } from 'node:crypto';
import type { DiscussionRepository } from '../repositories/discussions.repository.js';
import type { DraftRepository } from '../repositories/drafts.repository.js';
import type { Discussion } from '../types/discussion.js';
import type { Draft } from '../types/draft.js';

export const TEST_ORIGIN = 'http://localhost:5173';

export function fakeDiscussions(items: Discussion[] = []): DiscussionRepository {
  return {
    listDemo: async () => items,
    findDemoById: async (id) => items.find((item) => item.id === id) ?? null,
    countDemo: async () => items.length,
  };
}

/** In-memory stand-in so route tests can exercise create, update and delete without a database. */
export function fakeDrafts(discussions: Discussion[] = []): DraftRepository {
  const store: Draft[] = [];
  return {
    list: async () => [...store].reverse(),
    create: async (input) => {
      const now = new Date().toISOString();
      const source = discussions.find((d) => d.id === input.discussionId);
      const draft: Draft = {
        id: randomUUID(),
        discussionId: input.discussionId,
        draftText: input.draftText,
        tone: input.tone,
        status: 'draft',
        aiProvider: input.aiProvider,
        createdAt: now,
        updatedAt: now,
        discussion: source ? { source: source.source, content: source.content } : null,
      };
      store.push(draft);
      return draft;
    },
    update: async (id, changes) => {
      const draft = store.find((d) => d.id === id);
      if (!draft) return null;
      if (changes.draftText !== undefined) draft.draftText = changes.draftText;
      if (changes.status !== undefined) draft.status = changes.status;
      return draft;
    },
    remove: async (id) => {
      const index = store.findIndex((d) => d.id === id);
      if (index === -1) return false;
      store.splice(index, 1);
      return true;
    },
  };
}
