import type { Discussion, SourceMode } from '../types/discussion';

// Empty in tests; set to the Render URL in production (see .env.example).
const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '';

/** An error whose message is already written for the user. */
export class ApiError extends Error {}

export async function searchDiscussions(
  query: string,
  source: SourceMode,
  signal: AbortSignal,
): Promise<Discussion[]> {
  const params = new URLSearchParams({ query, source });

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/discussions?${params}`, { signal });
  } catch (err) {
    if (signal.aborted) throw err;
    throw new ApiError('Could not reach the SignalDesk API. Check your connection and try again.');
  }

  const body: { data: Discussion[] | null; error: { message: string } | null } | null =
    await response.json().catch(() => null);

  if (!body) {
    throw new ApiError(
      'The server sent an unexpected response. The API address may be misconfigured.',
    );
  }

  // shortcut: we trust our own API's response shape instead of re-validating it in the browser.
  if (!response.ok || !body.data) {
    throw new ApiError(body.error?.message ?? `Search failed (HTTP ${response.status}).`);
  }
  return body.data;
}
