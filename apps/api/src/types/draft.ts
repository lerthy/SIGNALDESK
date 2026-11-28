import type { DraftStatus, ModelDraft, Tone } from '../schemas/draft.schema.js';

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

export interface Draft {
  id: string;
  discussionId: string | null;
  draftText: string;
  tone: Tone;
  status: DraftStatus;
  aiProvider: 'groq' | 'template';
  createdAt: string;
  updatedAt: string;
  /** Synthetic demo discussion this draft answers; null for live posts. */
  discussion: { source: string; content: string } | null;
}
