import { describe, expect, it } from 'vitest';
import type { Discussion } from '../../types/discussion.js';
import { generateTemplateDraft } from './template.provider.js';

const discussion: Discussion = {
  id: '1',
  source: 'Demo Forum',
  content: 'What does term life insurance cover?',
  tags: ['term life', 'coverage', 'education'],
  publishedAt: '2026-10-01T00:00:00Z',
  isSynthetic: true,
  url: null,
};

describe('generateTemplateDraft', () => {
  it('is deterministic and names the topic from the tags, skipping "education"', () => {
    const first = generateTemplateDraft(discussion, 'friendly');
    expect(first).toEqual(generateTemplateDraft(discussion, 'friendly'));
    expect(first.suggestedReply).toContain('term life and coverage');
    expect(first.suggestedReply).not.toContain('education');
  });

  it('differs by tone and always says it is not AI-generated', () => {
    const replies = (['friendly', 'professional', 'empathetic'] as const).map((tone) => {
      const draft = generateTemplateDraft(discussion, tone);
      expect(draft.approach).toMatch(/not AI-generated/);
      return draft.suggestedReply;
    });
    expect(new Set(replies).size).toBe(3);
  });

  it('falls back to a generic topic when there are no useful tags', () => {
    const draft = generateTemplateDraft({ ...discussion, tags: ['education'] }, 'professional');
    expect(draft.suggestedReply).toContain('insurance');
  });
});
