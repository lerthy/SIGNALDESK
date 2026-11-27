// Discussions about personal hardship never get an outreach draft. Topic relevance
// is not the same as a person's needs, and we must not target vulnerable moments.
// shortcut: keyword patterns over-block on purpose (safe direction) and miss paraphrases, upgrade to a reviewed classifier if this ships beyond a demo.
const SENSITIVE_PATTERNS: { category: string; pattern: RegExp }[] = [
  {
    category: 'bereavement',
    pattern:
      /passed away|\bdied\b|death of|funeral|bereave|grieving|\bwidow|lost my (father|mother|dad|mom|husband|wife|partner|son|daughter|parent)/i,
  },
  { category: 'pregnancy', pattern: /pregnan|expecting a baby|expecting a child/i },
  {
    category: 'health',
    pattern: /diagnos|terminal|cancer|chemo|serious illness|hospitali[sz]ed|surgery|mental health/i,
  },
  {
    category: 'financial distress',
    pattern:
      /lost my job|laid off|behind on (my )?(bills|rent|payments)|can['’]?t afford|cannot afford|bankrupt|eviction|in debt/i,
  },
  {
    category: 'family circumstances',
    pattern: /divorce|custody|overwhelmed|\bscared\b|desperate/i,
  },
];

export interface EligibilityCheck {
  eligible: boolean;
  /** Plain-language reason shown to the user when blocked. */
  reason: string | null;
}

export function checkDraftEligibility(text: string): EligibilityCheck {
  const categories = SENSITIVE_PATTERNS.filter((p) => p.pattern.test(text)).map((p) => p.category);
  if (categories.length === 0) return { eligible: true, reason: null };

  return {
    eligible: false,
    reason: `This discussion mentions a sensitive personal circumstance (${categories.join(', ')}). SignalDesk does not draft outreach for it.`,
  };
}
