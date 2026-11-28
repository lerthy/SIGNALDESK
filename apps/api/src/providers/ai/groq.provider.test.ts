import { describe, expect, it } from 'vitest';
import { parseModelDraft } from './groq.provider.js';

const valid = {
  suggestedReply: 'A general answer.',
  approach: 'Kept it general.',
  safetyWarning: '',
};

describe('parseModelDraft', () => {
  it('accepts a response that matches the schema', () => {
    expect(parseModelDraft(JSON.stringify(valid))).toEqual(valid);
  });

  it.each([
    ['null', null],
    ['empty text', ''],
    ['text that is not JSON', 'Sure! Here is a reply.'],
    ['JSON missing a field', JSON.stringify({ suggestedReply: 'x', approach: 'y' })],
    ['an empty reply', JSON.stringify({ ...valid, suggestedReply: '   ' })],
    [
      'a reply over the length limit',
      JSON.stringify({ ...valid, suggestedReply: 'x'.repeat(1001) }),
    ],
    ['a field of the wrong type', JSON.stringify({ ...valid, safetyWarning: null })],
  ])('rejects %s', (_label, text) => {
    expect(() => parseModelDraft(text)).toThrow();
  });
});
