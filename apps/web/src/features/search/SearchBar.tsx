import { Search, X } from 'lucide-react';
import { useState } from 'react';
import type { SourceMode } from '../../types/discussion';

const EXAMPLE_QUERIES = [
  'term life insurance',
  'policy exclusions',
  '#deductible',
  'business continuity',
  'policy review checklist',
];

const SOURCES: { value: SourceMode; label: string }[] = [
  { value: 'demo', label: 'Demo data' },
  { value: 'bluesky', label: 'Bluesky' },
];

const MIN_QUERY_LENGTH = 2;

interface SearchBarProps {
  source: SourceMode;
  onSourceChange: (source: SourceMode) => void;
  onSearch: (query: string) => void;
  onClear: () => void;
  loading: boolean;
}

export function SearchBar({ source, onSourceChange, onSearch, onClear, loading }: SearchBarProps) {
  const [text, setText] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  function submit(value: string) {
    const query = value.trim();
    if (query.length < MIN_QUERY_LENGTH) {
      setValidationError(`Enter at least ${MIN_QUERY_LENGTH} characters.`);
      return;
    }
    setValidationError(null);
    onSearch(query);
  }

  function clear() {
    setText('');
    setValidationError(null);
    onClear();
  }

  return (
    <div>
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          submit(text);
        }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <div className="relative flex-1">
          <label htmlFor="search-input" className="sr-only">
            Keywords or hashtags
          </label>
          <Search
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
          />
          <input
            id="search-input"
            type="text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Keywords or hashtags, e.g. term life insurance"
            maxLength={100}
            autoComplete="off"
            aria-invalid={validationError ? true : undefined}
            aria-describedby={validationError ? 'search-error' : undefined}
            className="w-full rounded-md border border-line bg-surface py-2.5 pr-10 pl-9 text-sm placeholder:text-muted"
          />
          {text && (
            <button
              type="button"
              onClick={clear}
              aria-label="Clear search"
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-muted hover:text-ink"
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>

        <fieldset className="flex rounded-md border border-line bg-surface p-0.5">
          <legend className="sr-only">Source</legend>
          {SOURCES.map(({ value, label }) => (
            <label key={value} className="relative">
              <input
                type="radio"
                name="source"
                value={value}
                checked={source === value}
                onChange={() => onSourceChange(value)}
                className="peer sr-only"
              />
              <span className="block cursor-pointer rounded px-3 py-2 text-sm text-muted transition-colors peer-checked:bg-raised peer-checked:text-ink peer-focus-visible:outline-2 peer-focus-visible:outline-accent">
                {label}
              </span>
            </label>
          ))}
        </fieldset>

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-canvas transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {validationError && (
        <p id="search-error" role="alert" className="mt-2 text-sm text-danger">
          {validationError}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted">Try</span>
        {EXAMPLE_QUERIES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => {
              setText(example);
              submit(example);
            }}
            className="rounded-full border border-line px-3 py-1 text-muted transition-colors hover:border-muted hover:text-ink"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}
