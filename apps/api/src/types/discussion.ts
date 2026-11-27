export interface Discussion {
  id: string;
  source: string;
  content: string;
  tags: string[];
  publishedAt: string;
  isSynthetic: boolean;
  /** Public link to the original post; always null for synthetic demo data. */
  url: string | null;
}

export interface SearchResult extends Discussion {
  matchExplanation: string;
  draftEligible: boolean;
  /** Why drafting is blocked; null when draftEligible is true. */
  ineligibleReason: string | null;
}
