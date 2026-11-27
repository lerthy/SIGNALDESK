import { describe, expect, it } from 'vitest';
import type { Discussion } from '../types/discussion.js';
import { parseQueryTerms, searchDiscussions } from './search.js';

function discussion(overrides: Partial<Discussion>): Discussion {
  return {
    id: 'id',
    source: 'Demo Forum',
    content: 'placeholder',
    tags: [],
    publishedAt: '2026-10-01T00:00:00Z',
    isSynthetic: true,
    url: null,
    ...overrides,
  };
}

const termLife = discussion({
  id: 'term',
  content: 'What does term life insurance cover?',
  tags: ['education'],
  publishedAt: '2026-10-02T00:00:00Z',
});
const exclusions = discussion({
  id: 'excl',
  content: 'How do policy exclusions work?',
  tags: ['exclusions', 'education'],
  publishedAt: '2026-10-05T00:00:00Z',
});
const grief = discussion({
  id: 'grief',
  content: 'My father passed away and I have life insurance paperwork.',
  publishedAt: '2026-10-09T00:00:00Z',
});

describe('parseQueryTerms', () => {
  it('lowercases, strips hashtags and splits on spaces and commas', () => {
    expect(parseQueryTerms('#Term Life, exclusions')).toEqual(['term', 'life', 'exclusions']);
  });

  it('drops one-character noise', () => {
    expect(parseQueryTerms('a # b')).toEqual([]);
  });
});

describe('searchDiscussions', () => {
  const all = [termLife, exclusions, grief];

  it('requires every term to match, so "term life" does not return any "life" post', () => {
    const ids = searchDiscussions(all, 'term life').map((r) => r.id);
    expect(ids).toEqual(['term']);
  });

  it('matches on tags and says so in the explanation', () => {
    const [result] = searchDiscussions([exclusions], '#exclusions');
    expect(result?.matchExplanation).toBe('Keyword match: the text mentions "exclusions".');
    const [tagOnly] = searchDiscussions([termLife], 'education');
    expect(tagOnly?.matchExplanation).toBe('Keyword match: its tags include "education".');
  });

  it('sorts newest first', () => {
    const ids = searchDiscussions(all, 'life').map((r) => r.id);
    expect(ids).toEqual(['grief', 'term']);
  });

  it('flags sensitive discussions as not eligible for drafting', () => {
    const [result] = searchDiscussions([grief], 'life insurance');
    expect(result?.draftEligible).toBe(false);
    expect(result?.ineligibleReason).toContain('bereavement');
  });

  it('returns nothing when no term matches or the query has no usable terms', () => {
    expect(searchDiscussions(all, 'kubernetes')).toEqual([]);
    expect(searchDiscussions(all, '# a')).toEqual([]);
  });
});
