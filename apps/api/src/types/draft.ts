import type { ModelDraft, Tone } from '../schemas/draft.schema.js';

export interface AiProvider {
  generate(input: { content: string; tone: Tone }): Promise<ModelDraft>;
}

/** What the frontend receives from POST /api/drafts/generate. */
export interface DraftSuggestion {
  suggestedReply: string;
  approach: string;
  aiProvider: 'groq' | 'template';
  safetyWarning: string | null;
}
