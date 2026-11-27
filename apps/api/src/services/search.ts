import type { Discussion, SearchResult } from '../types/discussion.js';
import { checkDraftEligibility } from './sensitivity.js';

/** "#Term Life, exclusions" -> ["term", "life", "exclusions"] */
export function parseQueryTerms(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[\s,]+/)
    .map((term) => term.replace(/^#+/, ''))
    .filter((term) => term.length >= 2);
}

function explainMatch(discussion: Discussion, terms: string[]): string | null {
  const text = discussion.content.toLowerCase();
  const tags = discussion.tags.map((tag) => tag.toLowerCase());

  const inText = terms.filter((term) => text.includes(term));
  const inTagsOnly = terms.filter(
    (term) => !text.includes(term) && tags.some((tag) => tag.includes(term)),
  );

  // Every term must appear somewhere, otherwise "term life" would match any "life" post.
  if (inText.length + inTagsOnly.length < terms.length) return null;

  const quote = (list: string[]) => list.map((term) => `"${term}"`).join(', ');
  const parts: string[] = [];
  if (inText.length > 0) parts.push(`the text mentions ${quote(inText)}`);
  if (inTagsOnly.length > 0) parts.push(`its tags include ${quote(inTagsOnly)}`);
  return `Keyword match: ${parts.join(' and ')}.`;
}

/**
 * Newest first. Results are never ranked by anything about the author:
 * a keyword match only says the *topic* is relevant.
 */
export function searchDiscussions(discussions: Discussion[], query: string): SearchResult[] {
  const terms = parseQueryTerms(query);
  if (terms.length === 0) return [];

  return discussions
    .flatMap((discussion) => {
      const matchExplanation = explainMatch(discussion, terms);
      if (!matchExplanation) return [];

      const eligibility = checkDraftEligibility(discussion.content);
      return [
        {
          ...discussion,
          matchExplanation,
          draftEligible: eligibility.eligible,
          ineligibleReason: eligibility.reason,
        },
      ];
    })
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}
