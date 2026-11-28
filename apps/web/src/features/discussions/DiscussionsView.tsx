import { SearchX, Search, TriangleAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { addRecentSearch } from '../../lib/recentSearches';
import { StateMessage } from '../../components/StateMessage';
import type { SourceMode } from '../../types/discussion';
import { SearchBar } from '../search/SearchBar';
import { useDiscussionSearch } from '../search/useDiscussionSearch';
import { DiscussionDetail } from './DiscussionDetail';
import { DiscussionList } from './DiscussionList';

const MODE_LABEL: Record<SourceMode, string> = {
  demo: 'Demo data: synthetic discussions',
  bluesky: 'Live: public Bluesky posts',
};

function ResultsSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading discussions"
      role="status"
      className="border-t border-line"
    >
      {[0, 1, 2].map((row) => (
        <div key={row} className="space-y-2.5 border-b border-line py-4 pl-5">
          <div className="h-4 w-11/12 rounded bg-raised motion-safe:animate-pulse" />
          <div className="h-4 w-3/4 rounded bg-raised motion-safe:animate-pulse" />
          <div className="h-3 w-1/3 rounded bg-raised motion-safe:animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export function DiscussionsView({ initialQuery }: { initialQuery?: string }) {
  const { state, search, clear } = useDiscussionSearch();
  const [source, setSource] = useState<SourceMode>('demo');
  const [lastQuery, setLastQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function runSearch(query: string) {
    addRecentSearch(query);
    setLastQuery(query);
    setSelectedId(null);
    void search(query, source);
  }

  function handleClear() {
    clear();
    setLastQuery('');
    setSelectedId(null);
  }

  function changeSource(next: SourceMode) {
    setSource(next);
    // Old results belong to the old source, so drop them; the box keeps the typed text.
    handleClear();
  }

  // A recent search chosen on the Overview page arrives as initialQuery and runs once on mount.
  useEffect(() => {
    if (initialQuery) runSearch(initialQuery);
  }, []);

  const results = state.status === 'success' ? state.results : [];
  const selected = results.find((discussion) => discussion.id === selectedId) ?? null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Discussions</h1>
        <p className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-xs text-muted">
          <span
            aria-hidden="true"
            className={`size-1.5 rounded-full ${source === 'demo' ? 'bg-accent' : 'bg-amber'}`}
          />
          {MODE_LABEL[source]}
        </p>
      </header>

      <SearchBar
        source={source}
        onSourceChange={changeSource}
        onSearch={runSearch}
        onClear={handleClear}
        loading={state.status === 'loading'}
        initialText={initialQuery}
      />

      <div className="mt-8">
        {state.status === 'idle' && (
          <StateMessage Icon={Search} title="Search a topic to begin">
            Enter keywords or a hashtag about insurance, or pick an example above. Each result shows
            why it matched.
          </StateMessage>
        )}

        {state.status === 'loading' && <ResultsSkeleton />}

        {state.status === 'error' && (
          <StateMessage Icon={TriangleAlert} tone="error" title="Search failed">
            <p>{state.message}</p>
            <button
              type="button"
              onClick={() => runSearch(lastQuery)}
              className="mt-3 rounded-md border border-line px-3 py-1.5 text-ink hover:border-muted"
            >
              Try again
            </button>
          </StateMessage>
        )}

        {state.status === 'success' && results.length === 0 && (
          <StateMessage Icon={SearchX} title={`No discussions match “${state.query}”`}>
            Try fewer words, or one of the examples above. Every word you enter must appear in a
            discussion.
          </StateMessage>
        )}

        {state.status === 'success' && results.length > 0 && (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
            <div className={selected ? 'hidden lg:block' : undefined}>
              <DiscussionList
                query={state.query}
                results={results}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            </div>
            <div className={selected ? undefined : 'hidden lg:block'}>
              {selected ? (
                <DiscussionDetail discussion={selected} onBack={() => setSelectedId(null)} />
              ) : (
                <p className="rounded-lg border border-dashed border-line px-6 py-10 text-sm text-muted">
                  Select a discussion to read it in full and see why it matched.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
