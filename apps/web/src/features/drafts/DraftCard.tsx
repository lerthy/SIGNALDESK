import { useState } from 'react';
import { CopyButton } from '../../components/CopyButton';
import { deleteDraft, updateDraft, userMessage } from '../../lib/api';
import { formatDate } from '../../lib/format';
import type { Draft, DraftStatus } from '../../types/draft';
import { PROVIDER_LABELS, STATUS_LABELS, TONE_LABELS } from './labels';

interface DraftCardProps {
  draft: Draft;
  onChange: (draft: Draft) => void;
  onDelete: (id: string) => void;
}

const buttonClass =
  'rounded-md border border-line px-3 py-1.5 text-sm hover:border-muted disabled:opacity-60';

export function DraftCard({ draft, onChange, onDelete }: DraftCardProps) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(draft.draftText);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  async function run(action: () => Promise<void>, failure: string) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(userMessage(err, failure));
    } finally {
      setBusy(false);
    }
  }

  const setStatus = (status: DraftStatus) =>
    run(
      async () => onChange(await updateDraft(draft.id, { status })),
      'Could not update the draft.',
    );

  const saveText = () =>
    run(async () => {
      onChange(await updateDraft(draft.id, { draftText: text }));
      setEditing(false);
    }, 'Could not save your changes.');

  const remove = () =>
    run(async () => {
      await deleteDraft(draft.id);
      onDelete(draft.id);
    }, 'Could not delete the draft.');

  return (
    <li className="border-b border-line py-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        <span className="rounded border border-line px-1.5 py-0.5 text-ink">
          {STATUS_LABELS[draft.status]}
        </span>
        <span>{TONE_LABELS[draft.tone]}</span>
        <span>{PROVIDER_LABELS[draft.aiProvider]}</span>
        <time dateTime={draft.createdAt}>{formatDate(draft.createdAt)}</time>
      </div>

      {draft.discussion ? (
        <p className="mt-3 line-clamp-2 border-l-2 border-line pl-3 font-serif text-sm text-muted">
          {draft.discussion.source}: {draft.discussion.content}
        </p>
      ) : (
        <p className="mt-3 text-sm text-muted">The source discussion is no longer available.</p>
      )}

      {editing ? (
        <div className="mt-3 space-y-2">
          <label htmlFor={`edit-${draft.id}`} className="sr-only">
            Edit draft text
          </label>
          <textarea
            id={`edit-${draft.id}`}
            value={text}
            onChange={(event) => setText(event.target.value)}
            maxLength={2000}
            rows={6}
            className="w-full rounded-md border border-line bg-canvas p-3 text-sm leading-relaxed"
          />
        </div>
      ) : (
        <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap">{draft.draftText}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {editing ? (
          <>
            <button
              type="button"
              onClick={saveText}
              disabled={busy || text.trim() === ''}
              className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-canvas hover:opacity-90 disabled:opacity-60"
            >
              Save changes
            </button>
            <button
              type="button"
              onClick={() => {
                setText(draft.draftText);
                setEditing(false);
              }}
              className={buttonClass}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => setEditing(true)} className={buttonClass}>
              Edit
            </button>
            <CopyButton text={draft.draftText} />
            {draft.status !== 'reviewed' && (
              <button
                type="button"
                disabled={busy}
                onClick={() => setStatus('reviewed')}
                className={buttonClass}
              >
                Mark reviewed
              </button>
            )}
            {draft.status !== 'dismissed' && (
              <button
                type="button"
                disabled={busy}
                onClick={() => setStatus('dismissed')}
                className={buttonClass}
              >
                Dismiss
              </button>
            )}
            {draft.status !== 'draft' && (
              <button
                type="button"
                disabled={busy}
                onClick={() => setStatus('draft')}
                className={buttonClass}
              >
                Reopen
              </button>
            )}
            {confirmingDelete ? (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={remove}
                  className="rounded-md border border-danger px-3 py-1.5 text-sm text-danger hover:bg-danger/10 disabled:opacity-60"
                >
                  Confirm delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className={buttonClass}
                >
                  Keep
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className={`${buttonClass} ml-auto`}
              >
                Delete
              </button>
            )}
          </>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}
    </li>
  );
}
