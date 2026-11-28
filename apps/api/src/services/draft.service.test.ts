import { describe, expect, it, vi } from 'vitest';
import { HttpError } from '../middleware/errors.js';
import type { Discussion } from '../types/discussion.js';
import type { AiProvider } from '../types/draft.js';
import { generateDraft } from './draft.service.js';

const safe: Discussion = {
  id: '1',
  source: 'Demo Forum',
  content: 'How do policy exclusions work in general?',
  tags: ['exclusions'],
  publishedAt: '2026-10-01T00:00:00Z',
  isSynthetic: true,
  url: null,
};
const sensitive: Discussion = {
  ...safe,
  content: 'My father passed away last month and I am overwhelmed.',
};

function fakeAi(generate: AiProvider['generate']): AiProvider {
  return { generate };
}

describe('generateDraft', () => {
  it('blocks sensitive discussions with a 422 before any provider is called', async () => {
    const generate = vi.fn();
    await expect(generateDraft(fakeAi(generate), sensitive, 'empathetic')).rejects.toMatchObject({
      status: 422,
    });
    await expect(generateDraft(fakeAi(generate), sensitive, 'empathetic')).rejects.toBeInstanceOf(
      HttpError,
    );
    expect(generate).not.toHaveBeenCalled();
  });

  it('uses the labelled template when no AI provider is configured', async () => {
    const draft = await generateDraft(null, safe, 'friendly');
    expect(draft.aiProvider).toBe('template');
    expect(draft.safetyWarning).toBeNull();
    expect(draft.approach).toMatch(/not AI-generated/);
  });

  it('returns the AI draft and turns an empty warning into null', async () => {
    const generate = vi.fn().mockResolvedValue({
      suggestedReply: 'AI reply',
      approach: 'Kept it general.',
      safetyWarning: '',
    });
    const draft = await generateDraft(fakeAi(generate), safe, 'professional');
    expect(draft).toEqual({
      suggestedReply: 'AI reply',
      approach: 'Kept it general.',
      aiProvider: 'groq',
      safetyWarning: null,
    });
    expect(generate).toHaveBeenCalledWith({ content: safe.content, tone: 'professional' });
  });

  it('keeps a warning from the model', async () => {
    const generate = vi.fn().mockResolvedValue({
      suggestedReply: 'r',
      approach: 'a',
      safetyWarning: 'Borderline topic.',
    });
    const draft = await generateDraft(fakeAi(generate), safe, 'friendly');
    expect(draft.safetyWarning).toBe('Borderline topic.');
  });

  it('falls back to the template with a warning when the provider fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const generate = vi.fn().mockRejectedValue(new Error('429 rate limit'));
    const draft = await generateDraft(fakeAi(generate), safe, 'friendly');
    expect(draft.aiProvider).toBe('template');
    expect(draft.safetyWarning).toMatch(/AI provider was unavailable/);
  });
});
