import { HttpError } from '../middleware/errors.js';
import { generateTemplateDraft } from '../providers/ai/template.provider.js';
import type { Tone } from '../schemas/draft.schema.js';
import type { Discussion } from '../types/discussion.js';
import type { AiProvider, DraftSuggestion } from '../types/draft.js';
import { checkDraftEligibility } from './sensitivity.js';

const PROVIDER_UNAVAILABLE_WARNING =
  'The AI provider was unavailable, so this is a template draft.';

/** Shared by generating and saving, so the safety gate cannot be skipped by calling the save route directly. */
export function assertDraftEligible(discussion: Discussion): void {
  const eligibility = checkDraftEligibility(discussion.content);
  if (!eligibility.eligible) {
    throw new HttpError(
      422,
      eligibility.reason ?? 'A draft cannot be created for this discussion.',
    );
  }
}

function templateSuggestion(
  discussion: Discussion,
  tone: Tone,
  warning: string | null,
): DraftSuggestion {
  const draft = generateTemplateDraft(discussion, tone);
  return { ...draft, aiProvider: 'template', safetyWarning: warning };
}

/**
 * The safety check runs first, so sensitive discussions never reach any provider.
 * If the AI provider fails we return a clearly labelled template instead of an error,
 * so the workflow keeps working during provider outages and rate limits.
 */
export async function generateDraft(
  ai: AiProvider | null,
  discussion: Discussion,
  tone: Tone,
): Promise<DraftSuggestion> {
  assertDraftEligible(discussion);

  if (!ai) return templateSuggestion(discussion, tone, null);

  try {
    const draft = await ai.generate({ content: discussion.content, tone });
    return { ...draft, aiProvider: 'groq', safetyWarning: draft.safetyWarning || null };
  } catch (err) {
    // Message only: never log the discussion text or the request.
    console.error(
      'AI provider failed, using template:',
      err instanceof Error ? err.message : 'unknown',
    );
    return templateSuggestion(discussion, tone, PROVIDER_UNAVAILABLE_WARNING);
  }
}
