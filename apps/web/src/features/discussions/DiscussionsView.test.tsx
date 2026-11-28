import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Discussion } from '../../types/discussion';
import { DiscussionsView } from './DiscussionsView';

const allowed: Discussion = {
  id: '1',
  source: 'Demo Forum',
  content: 'How do policy exclusions work?',
  tags: ['exclusions'],
  publishedAt: '2026-10-04T16:40:00Z',
  isSynthetic: true,
  url: null,
  matchExplanation: 'Keyword match: the text mentions "exclusions".',
  draftEligible: true,
  ineligibleReason: null,
};

const blocked: Discussion = {
  ...allowed,
  id: '2',
  content: 'My father passed away and I need help with exclusions paperwork.',
  matchExplanation: 'Keyword match: the text mentions "exclusions".',
  draftEligible: false,
  ineligibleReason: 'This discussion mentions a sensitive personal circumstance (bereavement).',
};

function mockApi(status: number, body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

async function searchFor(text: string) {
  const user = userEvent.setup();
  await user.type(screen.getByRole('textbox', { name: /keywords or hashtags/i }), `${text}{Enter}`);
  return user;
}

afterEach(() => vi.unstubAllGlobals());

describe('DiscussionsView', () => {
  it('starts with a prompt and clearly says it is showing demo data', () => {
    render(<DiscussionsView />);
    expect(screen.getByText('Search a topic to begin')).toBeInTheDocument();
    expect(screen.getByText(/demo data: synthetic discussions/i)).toBeInTheDocument();
  });

  it('searches on Enter, shows a loading state, then the results with match explanations', async () => {
    let respond: (response: Response) => void = () => undefined;
    const fetchMock = vi
      .fn()
      .mockReturnValue(new Promise<Response>((resolve) => (respond = resolve)));
    vi.stubGlobal('fetch', fetchMock);
    render(<DiscussionsView />);

    await searchFor('exclusions');
    expect(screen.getByRole('status', { name: /loading discussions/i })).toBeInTheDocument();
    expect(fetchMock.mock.calls[0]?.[0]).toContain('/api/discussions?query=exclusions&source=demo');

    respond(new Response(JSON.stringify({ data: [allowed], error: null }), { status: 200 }));
    expect(await screen.findByText(/1 discussion for “exclusions”/)).toBeInTheDocument();
    expect(screen.getByText(allowed.matchExplanation)).toBeInTheDocument();
    expect(screen.getByText('Synthetic')).toBeInTheDocument();
  });

  it('shows an empty state when nothing matches', async () => {
    mockApi(200, { data: [], error: null });
    render(<DiscussionsView />);
    await searchFor('kubernetes');
    expect(await screen.findByText('No discussions match “kubernetes”')).toBeInTheDocument();
  });

  it('shows the API error message and lets the user retry', async () => {
    const fetchMock = mockApi(503, {
      data: null,
      error: { message: 'Bluesky search is not available yet.' },
    });
    render(<DiscussionsView />);
    const user = await searchFor('term life');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Bluesky search is not available yet.',
    );
    await user.click(screen.getByRole('button', { name: /try again/i }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  it('rejects a too-short query without calling the API', async () => {
    const fetchMock = mockApi(200, { data: [], error: null });
    render(<DiscussionsView />);
    await searchFor('a');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter at least 2 characters.');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('searches an example query with one click', async () => {
    const fetchMock = mockApi(200, { data: [allowed], error: null });
    render(<DiscussionsView />);
    await userEvent.setup().click(screen.getByRole('button', { name: 'policy exclusions' }));
    await screen.findByText(/1 discussion for/);
    expect(fetchMock.mock.calls[0]?.[0]).toContain('query=policy+exclusions');
  });

  it('shows the full discussion on selection, including why a blocked one cannot be drafted', async () => {
    mockApi(200, { data: [allowed, blocked], error: null });
    render(<DiscussionsView />);
    const user = await searchFor('exclusions');
    await screen.findByText(/2 discussions for/);

    await user.click(screen.getByRole('button', { name: /father passed away/i }));
    const detail = screen.getByRole('article');
    expect(within(detail).getByText('Draft blocked')).toBeInTheDocument();
    expect(within(detail).getByText(/bereavement/)).toBeInTheDocument();
    expect(within(detail).getByText(/says nothing about the person/i)).toBeInTheDocument();
  });

  it('clears the search and returns to the starting prompt', async () => {
    mockApi(200, { data: [allowed], error: null });
    render(<DiscussionsView />);
    const user = await searchFor('exclusions');
    await screen.findByText(/1 discussion for/);

    await user.click(screen.getByRole('button', { name: /clear search/i }));
    expect(screen.getByText('Search a topic to begin')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue('');
  });

  it('drops old results when the source changes, then searches the new source on request', async () => {
    const fetchMock = mockApi(200, { data: [allowed], error: null });
    render(<DiscussionsView />);
    const user = await searchFor('exclusions');
    await screen.findByText(/1 discussion for/);

    await user.click(screen.getByLabelText('Bluesky'));
    expect(screen.getByText('Search a topic to begin')).toBeInTheDocument();
    expect(screen.getByText(/live: public bluesky posts/i)).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue('exclusions');

    await user.click(screen.getByRole('button', { name: 'Search' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[1]?.[0]).toContain('source=bluesky');
  });

  it('ignores a slow older response that arrives after a newer search', async () => {
    const resolvers: ((response: Response) => void)[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init: RequestInit) => {
        return new Promise<Response>((resolve, reject) => {
          resolvers.push(resolve);
          init.signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          );
        });
      }),
    );
    render(<DiscussionsView />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'policy exclusions' }));
    await user.click(screen.getByRole('button', { name: 'term life insurance' }));
    const reply = (discussion: Discussion) =>
      new Response(JSON.stringify({ data: [discussion], error: null }), { status: 200 });

    resolvers[1]?.(reply({ ...allowed, id: 'new', content: 'Newer search result' }));
    await screen.findByText(/for “term life insurance”/);
    resolvers[0]?.(reply({ ...allowed, id: 'old', content: 'Older, slower result' }));

    await waitFor(() => expect(screen.getByText('Newer search result')).toBeInTheDocument());
    expect(screen.queryByText('Older, slower result')).not.toBeInTheDocument();
  });

  it('explains a misconfigured API address when the server answers with a web page', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('<!doctype html>', { status: 200 })),
    );
    render(<DiscussionsView />);
    await searchFor('exclusions');
    expect(await screen.findByRole('alert')).toHaveTextContent(/address may be misconfigured/i);
  });
});
