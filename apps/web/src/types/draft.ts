export type Tone = 'friendly' | 'professional' | 'empathetic';
export type DraftStatus = 'draft' | 'reviewed' | 'dismissed';
export type AiProvider = 'groq' | 'template';

/** Mirrors DraftSuggestion in apps/api/src/types/draft.ts. */
export interface DraftSuggestion {
  suggestedReply: string;
  approach: string;
  aiProvider: AiProvider;
  safetyWarning: string | null;
}

/** Mirrors Draft in apps/api/src/types/draft.ts. */
export interface Draft {
  id: string;
  discussionId: string | null;
  draftText: string;
  tone: Tone;
  status: DraftStatus;
  aiProvider: AiProvider;
  createdAt: string;
  updatedAt: string;
  discussion: { source: string; content: string } | null;
}

export interface Stats {
  discussions: number;
  drafts: Record<DraftStatus, number>;
  aiProvider: AiProvider;
}
