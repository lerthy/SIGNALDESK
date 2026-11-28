const STORAGE_KEY = 'signaldesk.recentSearches';
const MAX_RECENT = 5;

// Kept in this browser only: search text is never stored on the server.
export function getRecentSearches(): string[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(stored)
      ? stored.filter((item): item is string => typeof item === 'string')
      : [];
  } catch {
    // Blocked or corrupted storage only costs the "recent" list, so it is safe to ignore.
    return [];
  }
}

export function addRecentSearch(query: string) {
  const next = [query, ...getRecentSearches().filter((item) => item !== query)].slice(
    0,
    MAX_RECENT,
  );
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Same reason as above: failing to remember a search must never break searching.
  }
}
