import { ArrowLeft, ExternalLink } from 'lucide-react';
import { formatDate } from '../../lib/format';
import type { Discussion } from '../../types/discussion';
import { EligibilityLabel } from './EligibilityLabel';

interface DiscussionDetailProps {
  discussion: Discussion;
  onBack: () => void;
}

export function DiscussionDetail({ discussion, onBack }: DiscussionDetailProps) {
  return (
    <article className="rounded-lg border border-line bg-surface p-5 sm:p-6 lg:sticky lg:top-6">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink lg:hidden"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        Back to results
      </button>

      <blockquote className="font-serif text-xl leading-relaxed">{discussion.content}</blockquote>

      <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-5 gap-y-1.5 text-sm">
        <dt className="text-muted">Source</dt>
        <dd>{discussion.source}</dd>
        <dt className="text-muted">Published</dt>
        <dd>{formatDate(discussion.publishedAt)}</dd>
        <dt className="text-muted">Type</dt>
        <dd>{discussion.isSynthetic ? 'Synthetic demo discussion' : 'Live public post'}</dd>
        {discussion.url && (
          <>
            <dt className="text-muted">Original</dt>
            <dd>
              <a
                href={discussion.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-accent underline-offset-2 hover:underline"
              >
                View public post <ExternalLink size={13} aria-hidden="true" />
              </a>
            </dd>
          </>
        )}
      </dl>

      {discussion.tags.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Tags">
          {discussion.tags.map((tag) => (
            <li key={tag} className="rounded border border-line px-2 py-0.5 text-xs text-muted">
              #{tag}
            </li>
          ))}
        </ul>
      )}

      <section className="mt-6 border-t border-line pt-5">
        <h3 className="text-sm font-medium">Why it matched</h3>
        <p className="mt-1.5 text-sm text-muted">{discussion.matchExplanation}</p>
        <p className="mt-2 text-sm text-muted">
          This says the topic is relevant. It says nothing about the person who wrote it.
        </p>
      </section>

      <section className="mt-5 border-t border-line pt-5">
        <h3 className="text-sm font-medium">Reply draft</h3>
        <p className="mt-1.5 text-sm">
          <EligibilityLabel eligible={discussion.draftEligible} />
        </p>
        <p className="mt-1.5 text-sm text-muted">
          {discussion.draftEligible
            ? 'This discussion asks for general information, so a reply can be drafted for a person to review.'
            : discussion.ineligibleReason}
        </p>
      </section>
    </article>
  );
}
