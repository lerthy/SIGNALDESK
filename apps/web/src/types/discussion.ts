export type SourceMode = 'demo' | 'bluesky';

/** Mirrors SearchResult in apps/api/src/types/discussion.ts. */
export interface Discussion {
  id: string;
  source: string;
  content: string;
  tags: string[];
  publishedAt: string;
  isSynthetic: boolean;
  url: string | null;
  matchExplanation: string;
  draftEligible: boolean;
  ineligibleReason: string | null;
}
