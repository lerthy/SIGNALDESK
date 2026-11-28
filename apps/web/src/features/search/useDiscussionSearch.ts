import { useCallback, useEffect, useRef, useState } from 'react';
import { searchDiscussions, userMessage } from '../../lib/api';
import type { Discussion, SourceMode } from '../../types/discussion';

export type SearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; query: string; results: Discussion[] };

export function useDiscussionSearch() {
  const [state, setState] = useState<SearchState>({ status: 'idle' });
  const inFlight = useRef<AbortController | null>(null);

  const search = useCallback(async (query: string, source: SourceMode) => {
    // A newer search cancels the older one, so a slow response can't overwrite fresh results.
    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;

    setState({ status: 'loading' });
    try {
      const results = await searchDiscussions(query, source, controller.signal);
      setState({ status: 'success', query, results });
    } catch (err) {
      if (controller.signal.aborted) return;
      setState({
        status: 'error',
        message: userMessage(err, 'Search failed. Try again.'),
      });
    }
  }, []);

  const clear = useCallback(() => {
    inFlight.current?.abort();
    setState({ status: 'idle' });
  }, []);

  useEffect(() => () => inFlight.current?.abort(), []);

  return { state, search, clear };
}
