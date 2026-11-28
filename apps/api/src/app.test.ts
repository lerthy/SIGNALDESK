import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from './app.js';

const app = createApp({
  env: { FRONTEND_ORIGIN: 'http://localhost:5173' },
  discussions: { listDemo: async () => [], findDemoById: async () => null },
  ai: null,
});

describe('GET /api/health', () => {
  it('returns ok in the standard envelope', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: { status: 'ok' }, error: null });
  });

  it('returns a JSON 404 for unknown routes', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('Route not found');
  });
});

describe('request body errors', () => {
  it('returns 400 for malformed JSON', async () => {
    const res = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{bad json');
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Invalid request body');
  });

  it('returns 413 for an oversized body', async () => {
    const res = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ text: 'x'.repeat(60_000) }));
    expect(res.status).toBe(413);
  });

  it('trusts exactly one proxy so rate limiting sees real client IPs on Render', () => {
    expect(app.get('trust proxy')).toBe(1);
  });
});
