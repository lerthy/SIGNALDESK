import { formatDate } from '../../lib/format';
import type { Discussion } from '../../types/discussion';
import { EligibilityLabel } from './EligibilityLabel';

interface DiscussionListProps {
  query: string;
  results: Discussion[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function DiscussionList({ query, results, selectedId, onSelect }: DiscussionListProps) {
  const noun = results.length === 1 ? 'discussion' : 'discussions';

  return (
    <div>
      <h2 className="mb-1 text-sm text-muted" aria-live="polite">
        {results.length} {noun} for “{query}”
      </h2>
      <ul className="border-t border-line">
        {results.map((discussion) => (
          <li key={discussion.id} className="border-b border-line">
            <button
              type="button"
              onClick={() => onSelect(discussion.id)}
              aria-current={discussion.id === selectedId ? 'true' : undefined}
              className="relative block w-full py-4 pr-3 pl-5 text-left transition-colors hover:bg-surface aria-[current=true]:bg-surface"
            >
              <span
                aria-hidden="true"
                className={`absolute inset-y-3 left-0 w-0.5 rounded-full ${discussion.draftEligible ? 'bg-accent' : 'bg-amber'}`}
              />
              <p className="line-clamp-3 font-serif text-[1.0625rem] leading-relaxed">
                {discussion.content}
              </p>
              <p className="mt-2 text-sm text-muted">{discussion.matchExplanation}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                <span>{discussion.source}</span>
                <time dateTime={discussion.publishedAt}>{formatDate(discussion.publishedAt)}</time>
                {discussion.isSynthetic && (
                  <span className="rounded border border-line px-1.5 py-0.5">Synthetic</span>
                )}
                <EligibilityLabel eligible={discussion.draftEligible} />
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
