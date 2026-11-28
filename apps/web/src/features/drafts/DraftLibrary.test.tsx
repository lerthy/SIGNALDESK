import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fail, jsonBody, mockApi, ok } from '../../test/mockApi';
import type { Draft } from '../../types/draft';
import { DraftLibrary } from './DraftLibrary';

const first: Draft = {
  id: 'd1',
  discussionId: 'x',
  draftText: 'First draft text',
  tone: 'friendly',
  status: 'draft',
  aiProvider: 'groq',
  createdAt: '2026-11-01T10:00:00Z',
  updatedAt: '2026-11-01T10:00:00Z',
  discussion: { source: 'Demo Forum', content: 'What is a deductible?' },
};
const second: Draft = {
  ...first,
  id: 'd2',
  draftText: 'Second draft text',
  tone: 'professional',
  status: 'reviewed',
  aiProvider: 'template',
  discussion: null,
};

afterEach(() => vi.unstubAllGlobals());

function setup(drafts: Draft[] = [first, second], handler?: Parameters<typeof mockApi>[0]) {
  const fetchMock = mockApi(
    handler ??
      ((url, init) => {
        if (init.method === 'PATCH') {
          const changes = jsonBody(init) as Partial<Draft>;
          return ok({ ...first, ...changes });
        }
        if (init.method === 'DELETE') return ok({ id: 'd1' });
        return ok(drafts);
      }),
  );
  render(<DraftLibrary />);
  return { fetchMock, user: userEvent.setup() };
}

const card = (text: string) => {
  const item = screen.getByText(text).closest('li');
  if (!item) throw new Error(`No card for ${text}`);
  return within(item);
};

describe('DraftLibrary', () => {
  it('lists drafts with status, tone, provider and source reference', async () => {
    setup();
    expect(await screen.findByText('First draft text')).toBeInTheDocument();
    const one = card('First draft text');
    expect(one.getByText('Draft')).toBeInTheDocument();
    expect(one.getByText('Friendly')).toBeInTheDocument();
    expect(one.getByText('AI-generated with Groq')).toBeInTheDocument();
    expect(one.getByText(/Demo Forum: What is a deductible\?/)).toBeInTheDocument();

    const two = card('Second draft text');
    expect(two.getByText('Template draft, not AI-generated')).toBeInTheDocument();
    expect(two.getByText(/source discussion is no longer available/)).toBeInTheDocument();
  });

  it('says that reviewed never means sent', async () => {
    setup();
    expect(await screen.findByText(/never sends anything/)).toBeInTheDocument();
  });

  it('shows an empty state with guidance', async () => {
    setup([]);
    expect(await screen.findByText('No drafts yet')).toBeInTheDocument();
  });

  it('shows an error state when loading fails', async () => {
    setup([], () => fail(500, 'Something went wrong'));
    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong');
  });

  it('marks a draft reviewed, dismisses it, and reopens it', async () => {
    const { fetchMock, user } = setup([first]);
    await screen.findByText('First draft text');

    await user.click(screen.getByRole('button', { name: 'Mark reviewed' }));
    expect(await screen.findByRole('button', { name: 'Reopen' })).toBeInTheDocument();
    expect(card('First draft text').getByText('Reviewed')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mark reviewed' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    await waitFor(() =>
      expect(card('First draft text').getByText('Dismissed')).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('button', { name: 'Reopen' }));
    await waitFor(() => expect(card('First draft text').getByText('Draft')).toBeInTheDocument());

    const bodies = fetchMock.mock.calls
      .filter(([, init]) => init?.method === 'PATCH')
      .map(([, init]) => jsonBody(init));
    expect(bodies).toEqual([{ status: 'reviewed' }, { status: 'dismissed' }, { status: 'draft' }]);
  });

  it('edits the text and saves it, or discards the edit on cancel', async () => {
    const { fetchMock, user } = setup([first]);
    await screen.findByText('First draft text');

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    await user.clear(screen.getByRole('textbox', { name: 'Edit draft text' }));
    await user.type(screen.getByRole('textbox', { name: 'Edit draft text' }), 'Discarded');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByText('First draft text')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    const box = screen.getByRole('textbox', { name: 'Edit draft text' });
    expect(box).toHaveValue('First draft text');
    await user.clear(box);
    await user.type(box, 'Better wording');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Better wording')).toBeInTheDocument();
    const patches = fetchMock.mock.calls.filter(([, init]) => init?.method === 'PATCH');
    expect(patches).toHaveLength(1);
    expect(jsonBody(patches[0]?.[1])).toEqual({ draftText: 'Better wording' });
  });

  it('asks for confirmation before deleting', async () => {
    const { fetchMock, user } = setup([first, second]);
    await screen.findByText('First draft text');
    const deletes = () => fetchMock.mock.calls.filter(([, init]) => init?.method === 'DELETE');

    await user.click(card('First draft text').getByRole('button', { name: 'Delete' }));
    await user.click(screen.getByRole('button', { name: 'Keep' }));
    expect(deletes()).toHaveLength(0);

    await user.click(card('First draft text').getByRole('button', { name: 'Delete' }));
    await user.click(screen.getByRole('button', { name: 'Confirm delete' }));
    await waitFor(() => expect(screen.queryByText('First draft text')).not.toBeInTheDocument());
    expect(deletes()).toHaveLength(1);
    expect(screen.getByText('Second draft text')).toBeInTheDocument();
  });

  it('filters by status', async () => {
    const { user } = setup();
    await screen.findByText('First draft text');
    await user.click(screen.getByRole('button', { name: 'Reviewed (1)' }));
    expect(screen.queryByText('First draft text')).not.toBeInTheDocument();
    expect(screen.getByText('Second draft text')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Dismissed (0)' }));
    expect(screen.getByText('No drafts with this status.')).toBeInTheDocument();
  });

  it('keeps the draft and shows an error when an action fails', async () => {
    const { user } = setup([first], (url, init) =>
      init.method === 'PATCH' ? fail(500, 'Something went wrong') : ok([first]),
    );
    await screen.findByText('First draft text');
    await user.click(screen.getByRole('button', { name: 'Mark reviewed' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong');
    expect(card('First draft text').getByText('Draft')).toBeInTheDocument();
  });
});
