import type { Tone } from '../schemas/draft.schema.js';

export interface AiProvider {
  generate(input: { content: string; tone: Tone }): Promise<{
    suggestedReply: string;
    approach: string;
    safetyWarning: string;
  }>;
}

/** What the frontend receives from POST /api/drafts/generate. */
export interface DraftSuggestion {
  suggestedReply: string;
  approach: string;
  aiProvider: 'groq' | 'template';
  safetyWarning: string | null;
}
