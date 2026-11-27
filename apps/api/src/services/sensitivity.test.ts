import { describe, expect, it } from 'vitest';
import { checkDraftEligibility } from './sensitivity.js';

describe('checkDraftEligibility', () => {
  it('allows a general educational question', () => {
    expect(checkDraftEligibility('What does term life insurance cover in general?')).toEqual({
      eligible: true,
      reason: null,
    });
  });

  it.each([
    ['bereavement', 'My father passed away last month and I need help with paperwork.'],
    ['pregnancy', 'I just found out I am pregnant, should I think about coverage?'],
    ['health', 'I was recently diagnosed with a serious illness.'],
    ['financial distress', "I lost my job and can't afford my premiums."],
    ['financial distress', 'I can’t afford my premiums anymore.'],
    ['family circumstances', 'I am going through a divorce and wondering about policies.'],
  ])('blocks %s and names the category', (category, text) => {
    const result = checkDraftEligibility(text);
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain(category);
  });
});
