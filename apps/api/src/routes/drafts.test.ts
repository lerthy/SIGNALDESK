import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';
import type { Discussion } from '../types/discussion.js';
import type { AiProvider } from '../types/draft.js';

const ID = '00000000-0000-4000-8000-000000000001';
const SENSITIVE_ID = '00000000-0000-4000-8000-000000000002';

const discussions: Record<string, Discussion> = {
  [ID]: {
    id: ID,
    source: 'Demo Forum',
    content: 'What is a deductible?',
    tags: ['deductible'],
    publishedAt: '2026-10-01T00:00:00Z',
    isSynthetic: true,
    url: null,
  },
  [SENSITIVE_ID]: {
    id: SENSITIVE_ID,
    source: 'Demo Forum',
    content: 'I lost my job and cannot afford my premiums.',
    tags: [],
    publishedAt: '2026-10-01T00:00:00Z',
    isSynthetic: true,
    url: null,
  },
};

function appWith(ai: AiProvider | null) {
  return createApp({
    env: { FRONTEND_ORIGIN: 'http://localhost:5173' },
    discussions: { listDemo: async () => [], findDemoById: async (id) => discussions[id] ?? null },
    ai,
  });
}

describe('POST /api/drafts/generate', () => {
  it('returns a template draft when no AI key is configured', async () => {
    const res = await request(appWith(null))
      .post('/api/drafts/generate')
      .send({ discussionId: ID, tone: 'friendly' });
    expect(res.status).toBe(200);
    expect(res.body.error).toBeNull();
    expect(res.body.data).toMatchObject({ aiProvider: 'template', safetyWarning: null });
    expect(res.body.data.suggestedReply).toContain('deductible');
  });

  it('identifies the AI provider when the model answers', async () => {
    const ai: AiProvider = {
      generate: vi
        .fn()
        .mockResolvedValue({ suggestedReply: 'AI text', approach: 'a', safetyWarning: '' }),
    };
    const res = await request(appWith(ai))
      .post('/api/drafts/generate')
      .send({ discussionId: ID, tone: 'professional' });
    expect(res.body.data).toMatchObject({ aiProvider: 'groq', suggestedReply: 'AI text' });
  });

  it('refuses to draft for a sensitive discussion and explains why', async () => {
    const generate = vi.fn();
    const res = await request(appWith({ generate }))
      .post('/api/drafts/generate')
      .send({ discussionId: SENSITIVE_ID, tone: 'empathetic' });
    expect(res.status).toBe(422);
    expect(res.body.error.message).toMatch(/financial distress/);
    expect(generate).not.toHaveBeenCalled();
  });

  it('returns 404 for an unknown discussion', async () => {
    const res = await request(appWith(null))
      .post('/api/drafts/generate')
      .send({ discussionId: '00000000-0000-4000-8000-0000000000ff', tone: 'friendly' });
    expect(res.status).toBe(404);
  });

  it.each([
    ['a missing body', undefined],
    ['an id that is not a UUID', { discussionId: '123', tone: 'friendly' }],
    ['an unknown tone', { discussionId: ID, tone: 'aggressive' }],
  ])('returns 400 for %s', async (_label, body) => {
    const res = await request(appWith(null)).post('/api/drafts/generate').send(body);
    expect(res.status).toBe(400);
    expect(res.body.data).toBeNull();
  });

  it('rate limits generation more strictly than the rest of the API', async () => {
    const app = appWith(null);
    const send = () =>
      request(app).post('/api/drafts/generate').send({ discussionId: ID, tone: 'friendly' });
    for (let i = 0; i < 10; i++) expect((await send()).status).toBe(200);
    expect((await send()).status).toBe(429);
  });
});
