import { useState } from 'react';
import { CopyButton } from '../../components/CopyButton';
import { generateDraft, saveDraft, updateDraft, userMessage } from '../../lib/api';
import type { DraftSuggestion, Tone } from '../../types/draft';
import { PROVIDER_LABELS, TONE_LABELS } from './labels';

const MAX_DRAFT_LENGTH = 2000;

type Generation =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  // The tone is remembered from when the text was generated, not from the selector's current value.
  | { status: 'ready'; suggestion: DraftSuggestion; tone: Tone };

type SaveState = { status: 'idle' | 'saving' | 'saved' } | { status: 'error'; message: string };

export function DraftEditor({ discussionId }: { discussionId: string }) {
  const [tone, setTone] = useState<Tone>('friendly');
  const [generation, setGeneration] = useState<Generation>({ status: 'idle' });
  const [text, setText] = useState('');
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>({ status: 'idle' });

  async function generate() {
    setGeneration({ status: 'loading' });
    setSaveState({ status: 'idle' });
    try {
      const suggestion = await generateDraft(discussionId, tone);
      setText(suggestion.suggestedReply);
      // New text means a new draft: the saved one keeps the tone and provider it was created with.
      setSavedId(null);
      setGeneration({ status: 'ready', suggestion, tone });
    } catch (err) {
      setGeneration({
        status: 'error',
        message: userMessage(err, 'Could not generate a suggestion. Try again.'),
      });
    }
  }

  async function save() {
    if (generation.status !== 'ready') return;
    setSaveState({ status: 'saving' });
    try {
      if (savedId) {
        await updateDraft(savedId, { draftText: text });
      } else {
        const draft = await saveDraft({
          discussionId,
          draftText: text,
          tone: generation.tone,
          aiProvider: generation.suggestion.aiProvider,
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

  const loading = generation.status === 'loading';

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
          {loading
            ? 'Generating…'
            : generation.status === 'ready'
              ? 'Regenerate'
              : 'Generate suggestion'}
        </button>
      </div>

      {generation.status === 'error' && (
        <p role="alert" className="text-sm text-danger">
          {generation.message}
        </p>
      )}

      {generation.status === 'ready' && (
        <div className="space-y-3">
          <p className="text-sm">
            <span className="font-medium">
              {PROVIDER_LABELS[generation.suggestion.aiProvider]}.
            </span>{' '}
            <span className="text-muted">{generation.suggestion.approach}</span>
          </p>
          {generation.suggestion.safetyWarning && (
            <p role="note" className="text-sm text-amber">
              {generation.suggestion.safetyWarning}
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
            rows={7}
            className="w-full rounded-md border border-line bg-canvas p-3 text-sm leading-relaxed"
          />

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={save}
              disabled={saveState.status === 'saving' || text.trim() === ''}
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
