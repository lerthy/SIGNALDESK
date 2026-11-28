import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';
import { TEST_ORIGIN, fakeDiscussions, fakeDrafts } from '../testing/fakes.js';
import type { Discussion } from '../types/discussion.js';
import type { AiProvider } from '../types/draft.js';

const ID = '00000000-0000-4000-8000-000000000001';
const SENSITIVE_ID = '00000000-0000-4000-8000-000000000002';
const MISSING_ID = '00000000-0000-4000-8000-0000000000ff';

const allowed: Discussion = {
  id: ID,
  source: 'Demo Forum',
  content: 'What is a deductible?',
  tags: ['deductible'],
  publishedAt: '2026-10-01T00:00:00Z',
  isSynthetic: true,
  url: null,
};
const sensitive: Discussion = {
  ...allowed,
  id: SENSITIVE_ID,
  content: 'I lost my job and cannot afford my premiums.',
  tags: [],
};

function appWith(ai: AiProvider | null = null) {
  const items = [allowed, sensitive];
  return createApp({
    env: { FRONTEND_ORIGIN: TEST_ORIGIN },
    discussions: fakeDiscussions(items),
    drafts: fakeDrafts(items),
    ai,
  });
}

const validDraft = {
  discussionId: ID,
  draftText: 'A helpful reply.',
  tone: 'friendly',
  aiProvider: 'template',
};

describe('POST /api/drafts/generate', () => {
  it('returns a template draft when no AI key is configured', async () => {
    const res = await request(appWith())
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
    const res = await request(appWith())
      .post('/api/drafts/generate')
      .send({ discussionId: MISSING_ID, tone: 'friendly' });
    expect(res.status).toBe(404);
  });

  it.each([
    ['a missing body', undefined],
    ['an id that is not a UUID', { discussionId: '123', tone: 'friendly' }],
    ['an unknown tone', { discussionId: ID, tone: 'aggressive' }],
  ])('returns 400 for %s', async (_label, body) => {
    const res = await request(appWith()).post('/api/drafts/generate').send(body);
    expect(res.status).toBe(400);
    expect(res.body.data).toBeNull();
  });

  it('rate limits generation more strictly than the rest of the API', async () => {
    const app = appWith();
    const send = () =>
      request(app).post('/api/drafts/generate').send({ discussionId: ID, tone: 'friendly' });
    for (let i = 0; i < 10; i++) expect((await send()).status).toBe(200);
    expect((await send()).status).toBe(429);
  });
});

describe('POST /api/drafts', () => {
  it('saves a draft as "draft" with its source discussion', async () => {
    const res = await request(appWith()).post('/api/drafts').send(validDraft);
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      status: 'draft',
      draftText: 'A helpful reply.',
      aiProvider: 'template',
      discussion: { source: 'Demo Forum' },
    });
  });

  it('cannot be used to skip the safety gate for a sensitive discussion', async () => {
    const res = await request(appWith())
      .post('/api/drafts')
      .send({ ...validDraft, discussionId: SENSITIVE_ID });
    expect(res.status).toBe(422);
  });

  it('returns 404 when the discussion does not exist', async () => {
    const res = await request(appWith())
      .post('/api/drafts')
      .send({ ...validDraft, discussionId: MISSING_ID });
    expect(res.status).toBe(404);
  });

  it.each([
    ['no discussionId', { draftText: 'x', tone: 'friendly', aiProvider: 'template' }],
    ['a discussionId that is not a UUID', { ...validDraft, discussionId: '123' }],
    ['empty text', { ...validDraft, draftText: '   ' }],
    ['text over 2000 characters', { ...validDraft, draftText: 'x'.repeat(2001) }],
    ['an unknown provider', { ...validDraft, aiProvider: 'openai' }],
  ])('rejects %s with 400', async (_label, body) => {
    const res = await request(appWith()).post('/api/drafts').send(body);
    expect(res.status).toBe(400);
  });
});

describe('drafts rate limit', () => {
  it('allows 30 requests a minute to the drafts routes, then answers 429', async () => {
    const app = appWith();
    for (let i = 0; i < 30; i++) expect((await request(app).get('/api/drafts')).status).toBe(200);
    expect((await request(app).get('/api/drafts')).status).toBe(429);
  });
});

describe('draft lifecycle', () => {
  async function savedDraft(app: ReturnType<typeof appWith>) {
    const res = await request(app).post('/api/drafts').send(validDraft);
    return res.body.data.id as string;
  }

  it('lists saved drafts, newest first', async () => {
    const app = appWith();
    await savedDraft(app);
    await request(app)
      .post('/api/drafts')
      .send({ ...validDraft, draftText: 'Second' });
    const res = await request(app).get('/api/drafts');
    expect(res.body.data.map((d: { draftText: string }) => d.draftText)).toEqual([
      'Second',
      'A helpful reply.',
    ]);
  });

  it('edits the text and moves a draft through reviewed, dismissed and back', async () => {
    const app = appWith();
    const id = await savedDraft(app);

    const edited = await request(app)
      .patch(`/api/drafts/${id}`)
      .send({ draftText: 'Edited reply' });
    expect(edited.body.data.draftText).toBe('Edited reply');

    for (const status of ['reviewed', 'dismissed', 'draft']) {
      const res = await request(app).patch(`/api/drafts/${id}`).send({ status });
      expect(res.body.data.status).toBe(status);
    }
  });

  it('sends an edited draft back to "draft", unless the request sets a status itself', async () => {
    const app = appWith();
    const id = await savedDraft(app);
    await request(app).patch(`/api/drafts/${id}`).send({ status: 'reviewed' });

    const edited = await request(app).patch(`/api/drafts/${id}`).send({ draftText: 'New wording' });
    expect(edited.body.data).toMatchObject({ draftText: 'New wording', status: 'draft' });

    const explicit = await request(app)
      .patch(`/api/drafts/${id}`)
      .send({ draftText: 'Again', status: 'reviewed' });
    expect(explicit.body.data.status).toBe('reviewed');
  });

  it('rejects an invalid status, an empty update and a malformed id', async () => {
    const app = appWith();
    const id = await savedDraft(app);
    expect((await request(app).patch(`/api/drafts/${id}`).send({ status: 'sent' })).status).toBe(
      400,
    );
    expect((await request(app).patch(`/api/drafts/${id}`).send({})).status).toBe(400);
    expect(
      (await request(app).patch('/api/drafts/not-a-uuid').send({ status: 'reviewed' })).status,
    ).toBe(400);
  });

  it('returns 404 when updating or deleting a draft that does not exist', async () => {
    const app = appWith();
    expect(
      (await request(app).patch(`/api/drafts/${MISSING_ID}`).send({ status: 'reviewed' })).status,
    ).toBe(404);
    expect((await request(app).delete(`/api/drafts/${MISSING_ID}`)).status).toBe(404);
  });

  it('deletes a draft once', async () => {
    const app = appWith();
    const id = await savedDraft(app);
    expect((await request(app).delete(`/api/drafts/${id}`)).body.data).toEqual({ id });
    expect((await request(app).get('/api/drafts')).body.data).toEqual([]);
    expect((await request(app).delete(`/api/drafts/${id}`)).status).toBe(404);
  });
});

describe('GET /api/stats', () => {
  it('counts discussions and drafts by status from the stored data', async () => {
    const app = appWith();
    const first = (await request(app).post('/api/drafts').send(validDraft)).body.data.id;
    await request(app).post('/api/drafts').send(validDraft);
    await request(app).patch(`/api/drafts/${first}`).send({ status: 'reviewed' });

    const res = await request(app).get('/api/stats');
    expect(res.body.data).toEqual({
      discussions: 2,
      drafts: { draft: 1, reviewed: 1, dismissed: 0 },
      aiProvider: 'template',
    });
  });

  it('reports Groq as the provider when an AI provider is configured', async () => {
    const res = await request(appWith({ generate: vi.fn() })).get('/api/stats');
    expect(res.body.data.aiProvider).toBe('groq');
  });
});
