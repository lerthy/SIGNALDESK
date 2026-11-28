import { TriangleAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { StateMessage } from '../../components/StateMessage';
import { getStats, userMessage } from '../../lib/api';
import { getRecentSearches } from '../../lib/recentSearches';
import type { Stats } from '../../types/draft';

type LoadState =
  { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; stats: Stats };

export function OverviewView({ onSearch }: { onSearch: (query: string) => void }) {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [recent] = useState(getRecentSearches);

  useEffect(() => {
    const controller = new AbortController();
    getStats(controller.signal)
      .then((stats) => setState({ status: 'ready', stats }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setState({ status: 'error', message: userMessage(err, 'Could not load the overview.') });
      });
    return () => controller.abort();
  }, []);

  return (
    <div className="max-w-3xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <h1 className="text-xl font-semibold tracking-tight">Overview</h1>

      {state.status === 'loading' && (
        <p role="status" className="mt-8 text-sm text-muted">
          Loading overview…
        </p>
      )}

      {state.status === 'error' && (
        <div className="mt-8">
          <StateMessage Icon={TriangleAlert} tone="error" title="Could not load the overview">
            {state.message}
          </StateMessage>
        </div>
      )}

      {state.status === 'ready' && (
        <>
          <dl className="mt-6 border-t border-line text-sm">
            <Row label="Mode" value="Demo data: synthetic discussions" />
            <Row
              label="Reply suggestions"
              value={
                state.stats.aiProvider === 'groq'
                  ? 'AI-generated with Groq'
                  : 'Template fallback (no AI key configured)'
              }
            />
            <Row label="Discussions available" value={state.stats.discussions} />
            <Row
              label="Saved drafts"
              value={Object.values(state.stats.drafts).reduce((sum, n) => sum + n, 0)}
            />
            <Row label="Awaiting review" value={state.stats.drafts.draft} />
            <Row label="Reviewed" value={state.stats.drafts.reviewed} />
            <Row label="Dismissed" value={state.stats.drafts.dismissed} />
          </dl>

          <section className="mt-8">
            <h2 className="text-sm font-medium">Recent searches</h2>
            {recent.length === 0 ? (
              <p className="mt-2 text-sm text-muted">
                Searches you run appear here, kept in this browser only.
              </p>
            ) : (
              <ul className="mt-3 flex flex-wrap gap-2">
                {recent.map((query) => (
                  <li key={query}>
                    <button
                      type="button"
                      onClick={() => onSearch(query)}
                      className="rounded-full border border-line px-3 py-1 text-sm text-muted transition-colors hover:border-muted hover:text-ink"
                    >
                      {query}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-3">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}
