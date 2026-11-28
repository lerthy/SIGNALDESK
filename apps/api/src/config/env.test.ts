import { describe, expect, it } from 'vitest';
import { loadEnv } from './env.js';

const valid = {
  FRONTEND_ORIGIN: 'http://localhost:5173',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SECRET_KEY: 'test-secret',
};

describe('loadEnv', () => {
  it('applies defaults and treats an empty GROQ_API_KEY as unset', () => {
    const env = loadEnv({ ...valid, GROQ_API_KEY: '' });
    expect(env.PORT).toBe(3001);
    expect(env.GROQ_API_KEY).toBeUndefined();
  });

  it('requires a model name when a Groq key is set', () => {
    expect(() => loadEnv({ ...valid, GROQ_API_KEY: 'key' })).toThrow(/GROQ_MODEL/);
    expect(loadEnv({ ...valid, GROQ_API_KEY: 'key', GROQ_MODEL: 'some-model' }).GROQ_MODEL).toBe(
      'some-model',
    );
  });

  it('lists missing variables without leaking values', () => {
    expect(() => loadEnv({ SUPABASE_SECRET_KEY: 'super-secret-value' })).toThrow(/SUPABASE_URL/);
    expect(() => loadEnv({ SUPABASE_SECRET_KEY: 'super-secret-value' })).not.toThrow(
      /super-secret-value/,
    );
  });
});
