import type { AiProvider, DraftStatus, Tone } from '../../types/draft';

export const TONE_LABELS: Record<Tone, string> = {
  friendly: 'Friendly',
  professional: 'Professional',
  empathetic: 'Empathetic',
};

export const STATUS_LABELS: Record<DraftStatus, string> = {
  draft: 'Draft',
  reviewed: 'Reviewed',
  dismissed: 'Dismissed',
};

/** Template drafts must never look like AI output. */
export const PROVIDER_LABELS: Record<AiProvider, string> = {
  groq: 'AI-generated with Groq',
  template: 'Template draft, not AI-generated',
};

/** Mirrors the limit the API enforces on draft text. */
export const MAX_DRAFT_LENGTH = 2000;
