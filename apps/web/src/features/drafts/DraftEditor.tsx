import { useState } from 'react';
import { CopyButton } from '../../components/CopyButton';
import { generateDraft, saveDraft, updateDraft, userMessage } from '../../lib/api';
import type { DraftSuggestion, Tone } from '../../types/draft';
import { MAX_DRAFT_LENGTH, PROVIDER_LABELS, TONE_LABELS } from './labels';

// The tone is remembered from when the text was generated, not from the selector's current value.
interface Generated {
  suggestion: DraftSuggestion;
  tone: Tone;
}

type SaveState = { status: 'idle' | 'saving' | 'saved' } | { status: 'error'; message: string };

export function DraftEditor({ discussionId }: { discussionId: string }) {
  const [tone, setTone] = useState<Tone>('friendly');
  const [generated, setGenerated] = useState<Generated | null>(null);
  const [loading, setLoading] = useState(false);
  // Separate from `generated` on purpose: a failed Regenerate must not hide the text being edited.
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>({ status: 'idle' });

  async function generate() {
    setLoading(true);
    setGenerateError(null);
    try {
      const suggestion = await generateDraft(discussionId, tone);
      setText(suggestion.suggestedReply);
      // New text means a new draft: the saved one keeps the tone and provider it was created with.
      setSavedId(null);
      setSaveState({ status: 'idle' });
      setGenerated({ suggestion, tone });
    } catch (err) {
      setGenerateError(userMessage(err, 'Could not generate a suggestion. Try again.'));
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!generated) return;
    setSaveState({ status: 'saving' });
    try {
      if (savedId) {
        await updateDraft(savedId, { draftText: text });
      } else {
        const draft = await saveDraft({
          discussionId,
          draftText: text,
          tone: generated.tone,
          aiProvider: generated.suggestion.aiProvider,
        });
        setSavedId(draft.id);
      }
      setSaveState({ status: 'saved' });
    } catch (err) {
      setSaveState({
        status: 'error',
        message: userMessage(err, 'Could not save the draft. Try again.'),
      });
    }
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <fieldset className="flex rounded-md border border-line bg-canvas p-0.5">
          <legend className="sr-only">Tone</legend>
          {(Object.keys(TONE_LABELS) as Tone[]).map((value) => (
            <label key={value} className="relative">
              <input
                type="radio"
                name="tone"
                value={value}
                checked={tone === value}
                onChange={() => setTone(value)}
                className="peer sr-only"
              />
              <span className="block cursor-pointer rounded px-3 py-1.5 text-sm text-muted transition-colors peer-checked:bg-raised peer-checked:text-ink peer-focus-visible:outline-2 peer-focus-visible:outline-accent">
                {TONE_LABELS[value]}
              </span>
            </label>
          ))}
        </fieldset>
        <button
          type="button"
          onClick={generate}
          disabled={loading}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-canvas hover:opacity-90 disabled:opacity-60"
        >
          {loading ? 'Generating…' : generated ? 'Regenerate' : 'Generate suggestion'}
        </button>
      </div>

      {generateError && (
        <p role="alert" className="text-sm text-danger">
          {generateError}
        </p>
      )}

      {generated && (
        <div className="space-y-3">
          <p className="text-sm">
            <span className="font-medium">{PROVIDER_LABELS[generated.suggestion.aiProvider]}.</span>{' '}
            <span className="text-muted">{generated.suggestion.approach}</span>
          </p>
          {generated.suggestion.safetyWarning && (
            <p role="note" className="text-sm text-amber">
              {generated.suggestion.safetyWarning}
            </p>
          )}

          <label htmlFor="draft-text" className="block text-sm font-medium">
            Your reply
          </label>
          <textarea
            id="draft-text"
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              if (saveState.status === 'saved') setSaveState({ status: 'idle' });
            }}
            maxLength={MAX_DRAFT_LENGTH}
            readOnly={loading}
            rows={7}
            className="w-full rounded-md border border-line bg-canvas p-3 text-sm leading-relaxed"
          />

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={save}
              disabled={saveState.status === 'saving' || loading || text.trim() === ''}
              className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-canvas hover:opacity-90 disabled:opacity-60"
            >
              {savedId ? 'Update draft' : 'Save draft'}
            </button>
            <CopyButton text={text} />
            <span className="ml-auto text-xs text-muted">
              {text.length}/{MAX_DRAFT_LENGTH}
            </span>
          </div>

          {saveState.status === 'saved' && (
            <p role="status" className="text-sm text-accent">
              Saved. Find it under Drafts to review it.
            </p>
          )}
          {saveState.status === 'error' && (
            <p role="alert" className="text-sm text-danger">
              {saveState.message}
            </p>
          )}
          <p className="text-xs text-muted">
            SignalDesk never posts anything. Copy the reply to use it yourself.
          </p>
        </div>
      )}
    </div>
  );
}
