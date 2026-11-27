import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';
import type { DiscussionRepository } from '../repositories/discussions.repository.js';
import type { Discussion } from '../types/discussion.js';

const sample: Discussion = {
  id: '1',
  source: 'Demo Forum',
  content: 'How do policy exclusions work?',
  tags: ['exclusions'],
  publishedAt: '2026-10-04T16:40:00Z',
  isSynthetic: true,
  url: null,
};

function appWith(repo: DiscussionRepository) {
  return createApp({ env: { FRONTEND_ORIGIN: 'http://localhost:5173' }, discussions: repo });
}

describe('GET /api/discussions', () => {
  const app = appWith({ listDemo: async () => [sample] });

  it('returns matching demo discussions with an explanation', async () => {
    const res = await request(app).get('/api/discussions?query=exclusions');
    expect(res.status).toBe(200);
    expect(res.body.error).toBeNull();
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({ id: '1', isSynthetic: true, draftEligible: true });
  });

  it('rejects a missing or too short query with 400', async () => {
    for (const url of ['/api/discussions', '/api/discussions?query=a']) {
      const res = await request(app).get(url);
      expect(res.status).toBe(400);
      expect(res.body.data).toBeNull();
    }
  });

  it('rejects an unknown source with 400', async () => {
    const res = await request(app).get('/api/discussions?query=term&source=twitter');
    expect(res.status).toBe(400);
  });

  it('reports Bluesky as unavailable instead of faking results', async () => {
    const res = await request(app).get('/api/discussions?query=term&source=bluesky');
    expect(res.status).toBe(503);
    expect(res.body.error.message).toMatch(/not available/);
  });

  it('hides database error details behind a generic 500', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const failing = appWith({
      listDemo: async () => {
        throw new Error('connection to db.secret-host.supabase.co refused');
      },
    });
    const res = await request(failing).get('/api/discussions?query=term');
    expect(res.status).toBe(500);
    expect(JSON.stringify(res.body)).not.toContain('secret-host');
  });
});
