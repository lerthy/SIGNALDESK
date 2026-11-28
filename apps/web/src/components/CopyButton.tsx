import { Check, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';

export function CopyButton({ text }: { text: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');

  useEffect(() => {
    if (state === 'idle') return;
    const timer = setTimeout(() => setState('idle'), 2500);
    return () => clearTimeout(timer);
  }, [state]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState('copied');
    } catch {
      // Clipboard access can be blocked (insecure page, denied permission): tell the user how to recover.
      setState('failed');
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={copy}
        className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-sm hover:border-muted"
      >
        {state === 'copied' ? (
          <Check size={14} aria-hidden="true" />
        ) : (
          <Copy size={14} aria-hidden="true" />
        )}
        {state === 'copied' ? 'Copied' : 'Copy'}
      </button>
      {state === 'failed' && (
        <span role="alert" className="text-sm text-danger">
          Copy failed. Select the text and copy it manually.
        </span>
      )}
    </>
  );
}
