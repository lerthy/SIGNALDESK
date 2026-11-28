import { FileText, TriangleAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { StateMessage } from '../../components/StateMessage';
import { listDrafts, userMessage } from '../../lib/api';
import type { Draft, DraftStatus } from '../../types/draft';
import { DraftCard } from './DraftCard';
import { STATUS_LABELS } from './labels';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; drafts: Draft[] };

type Filter = DraftStatus | 'all';

const FILTERS: Filter[] = ['all', 'draft', 'reviewed', 'dismissed'];

export function DraftLibrary() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    const controller = new AbortController();
    listDrafts(controller.signal)
      .then((drafts) => setState({ status: 'ready', drafts }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setState({ status: 'error', message: userMessage(err, 'Could not load your drafts.') });
      });
    return () => controller.abort();
  }, []);

  function changeDrafts(change: (drafts: Draft[]) => Draft[]) {
    setState((current) =>
      current.status === 'ready' ? { ...current, drafts: change(current.drafts) } : current,
    );
  }

  const drafts = state.status === 'ready' ? state.drafts : [];
  const visible = filter === 'all' ? drafts : drafts.filter((draft) => draft.status === filter);

  return (
    <div className="max-w-3xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <h1 className="text-xl font-semibold tracking-tight">Drafts</h1>
      <p className="mt-1 text-sm text-muted">
        Reviewed means a person has checked the draft. SignalDesk never sends anything.
      </p>

      {state.status === 'loading' && (
        <p role="status" className="mt-8 text-sm text-muted">
          Loading drafts…
        </p>
      )}

      {state.status === 'error' && (
        <div className="mt-8">
          <StateMessage Icon={TriangleAlert} tone="error" title="Could not load drafts">
            {state.message}
          </StateMessage>
        </div>
      )}

      {state.status === 'ready' && drafts.length === 0 && (
        <div className="mt-8">
          <StateMessage Icon={FileText} title="No drafts yet">
            Open a discussion, generate a suggestion and save it. It will appear here for review.
          </StateMessage>
        </div>
      )}

      {drafts.length > 0 && (
        <>
          <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Filter by status">
            {FILTERS.map((value) => {
              const count =
                value === 'all' ? drafts.length : drafts.filter((d) => d.status === value).length;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={filter === value}
                  onClick={() => setFilter(value)}
                  className="rounded-full border border-line px-3 py-1 text-sm text-muted transition-colors hover:text-ink aria-pressed:border-muted aria-pressed:bg-raised aria-pressed:text-ink"
                >
                  {value === 'all' ? 'All' : STATUS_LABELS[value]} ({count})
                </button>
              );
            })}
          </div>

          {visible.length === 0 ? (
            <p className="mt-6 text-sm text-muted">No drafts with this status.</p>
          ) : (
            <ul className="mt-4 border-t border-line">
              {visible.map((draft) => (
                <DraftCard
                  key={draft.id}
                  draft={draft}
                  onChange={(updated) =>
                    changeDrafts((all) => all.map((d) => (d.id === updated.id ? updated : d)))
                  }
                  onDelete={(id) => changeDrafts((all) => all.filter((d) => d.id !== id))}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
