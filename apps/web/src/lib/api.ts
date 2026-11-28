import type { Discussion, SourceMode } from '../types/discussion';
import type { AiProvider, Draft, DraftStatus, DraftSuggestion, Stats, Tone } from '../types/draft';

// Empty in tests; set to the Render URL in production (see .env.example).
const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '';

/** An error whose message is already written for the user. */
export class ApiError extends Error {}

/** Shows our own messages to the user, and a generic one for anything unexpected. */
export function userMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
}

async function request<T>(path: string, { method = 'GET', body, signal }: RequestOptions = {}) {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      signal,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (err) {
    if (signal?.aborted) throw err;
    throw new ApiError('Could not reach the SignalDesk API. Check your connection and try again.');
  }

  const parsed: { data: T | null; error: { message: string } | null } | null = await response
    .json()
    .catch(() => null);

  if (!parsed) {
    throw new ApiError(
      'The server sent an unexpected response. The API address may be misconfigured.',
    );
  }

  // shortcut: we trust our own API's response shape instead of re-validating it in the browser.
  if (!response.ok || parsed.data === null) {
    throw new ApiError(parsed.error?.message ?? `Request failed (HTTP ${response.status}).`);
  }
  return parsed.data;
}

export function searchDiscussions(query: string, source: SourceMode, signal: AbortSignal) {
  const params = new URLSearchParams({ query, source });
  return request<Discussion[]>(`/api/discussions?${params}`, { signal });
}

export function generateDraft(discussionId: string, tone: Tone) {
  return request<DraftSuggestion>('/api/drafts/generate', {
    method: 'POST',
    body: { discussionId, tone },
  });
}

export function saveDraft(draft: {
  discussionId: string;
  draftText: string;
  tone: Tone;
  aiProvider: AiProvider;
}) {
  return request<Draft>('/api/drafts', { method: 'POST', body: draft });
}

export function listDrafts(signal?: AbortSignal) {
  return request<Draft[]>('/api/drafts', { signal });
}

export function updateDraft(id: string, changes: { draftText?: string; status?: DraftStatus }) {
  return request<Draft>(`/api/drafts/${id}`, { method: 'PATCH', body: changes });
}

export async function deleteDraft(id: string) {
  await request<{ id: string }>(`/api/drafts/${id}`, { method: 'DELETE' });
}

export function getStats(signal?: AbortSignal) {
  return request<Stats>('/api/stats', { signal });
}
