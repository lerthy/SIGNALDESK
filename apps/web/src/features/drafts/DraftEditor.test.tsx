import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fail, jsonBody, mockApi, ok } from '../../test/mockApi';
import type { DraftSuggestion } from '../../types/draft';
import { DraftEditor } from './DraftEditor';

const template: DraftSuggestion = {
  suggestedReply: 'Template reply about deductibles.',
  approach: 'Template draft, not AI-generated: it names the topic.',
  aiProvider: 'template',
  safetyWarning: null,
};

const groq: DraftSuggestion = {
  suggestedReply: 'AI reply about deductibles.',
  approach: 'Kept it general and friendly.',
  aiProvider: 'groq',
  safetyWarning: 'The AI provider was unavailable, so this is a template draft.',
};

const savedDraft = { id: 'draft-1' };

afterEach(() => vi.unstubAllGlobals());

function setup(suggestion: DraftSuggestion = template) {
  const fetchMock = mockApi((url, init) => {
    if (url.endsWith('/api/drafts/generate')) return ok(suggestion);
    if (url.endsWith('/api/drafts') && init.method === 'POST') return ok(savedDraft);
    return ok(savedDraft);
  });
  render(<DraftEditor discussionId="d1" />);
  return { fetchMock, user: userEvent.setup() };
}

const callsTo = (fetchMock: ReturnType<typeof mockApi>, method: string) =>
  fetchMock.mock.calls.filter(([, init]) => init?.method === method);

describe('DraftEditor', () => {
  it('generates with the chosen tone and labels a template draft as not AI-generated', async () => {
    const { fetchMock, user } = setup();
    await user.click(screen.getByLabelText('Empathetic'));
    await user.click(screen.getByRole('button', { name: 'Generate suggestion' }));

    expect(await screen.findByText(/Template draft, not AI-generated\./)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Your reply' })).toHaveValue(
      template.suggestedReply,
    );
    expect(jsonBody(fetchMock.mock.calls[0]?.[1])).toEqual({
      discussionId: 'd1',
      tone: 'empathetic',
    });
  });

  it('identifies the AI provider and shows any warning', async () => {
    const { user } = setup(groq);
    await user.click(screen.getByRole('button', { name: 'Generate suggestion' }));
    expect(await screen.findByText('AI-generated with Groq.')).toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveTextContent('AI provider was unavailable');
  });

  it('saves the edited text, then updates the same draft on the next save', async () => {
    const { fetchMock, user } = setup(groq);
    await user.click(screen.getByRole('button', { name: 'Generate suggestion' }));
    const box = await screen.findByRole('textbox', { name: 'Your reply' });

    await user.clear(box);
    await user.type(box, 'My own wording');
    await user.click(screen.getByRole('button', { name: 'Save draft' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Saved.');
    expect(jsonBody(callsTo(fetchMock, 'POST')[1]?.[1])).toEqual({
      discussionId: 'd1',
      draftText: 'My own wording',
      tone: 'friendly',
      aiProvider: 'groq',
    });

    await user.type(box, '!');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Update draft' }));
    await waitFor(() => expect(callsTo(fetchMock, 'PATCH')).toHaveLength(1));
    expect(callsTo(fetchMock, 'PATCH')[0]?.[0]).toContain('/api/drafts/draft-1');
    expect(jsonBody(callsTo(fetchMock, 'PATCH')[0]?.[1])).toEqual({ draftText: 'My own wording!' });
  });

  it("saves with the tone the text was generated with, not the selector's later value", async () => {
    const { fetchMock, user } = setup();
    await user.click(screen.getByRole('button', { name: 'Generate suggestion' }));
    await screen.findByRole('textbox', { name: 'Your reply' });

    await user.click(screen.getByLabelText('Professional'));
    await user.click(screen.getByRole('button', { name: 'Save draft' }));
    await screen.findByRole('status');
    expect(jsonBody(callsTo(fetchMock, 'POST')[1]?.[1])).toMatchObject({ tone: 'friendly' });
  });

  it('regenerating replaces the text and starts a new draft on the next save', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Generate suggestion' }));
    await user.click(await screen.findByRole('button', { name: 'Save draft' }));
    await user.click(await screen.findByRole('button', { name: 'Update draft' }));

    await user.click(screen.getByRole('button', { name: 'Regenerate' }));
    expect(await screen.findByRole('button', { name: 'Save draft' })).toBeInTheDocument();
  });

  it('copies the edited text', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Generate suggestion' }));
    const box = await screen.findByRole('textbox', { name: 'Your reply' });
    await user.clear(box);
    await user.type(box, 'Edited before copying');

    await user.click(screen.getByRole('button', { name: 'Copy' }));
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeInTheDocument();
    expect(await navigator.clipboard.readText()).toBe('Edited before copying');
  });

  it('tells the user how to recover when copying is blocked', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Generate suggestion' }));
    await screen.findByRole('textbox', { name: 'Your reply' });
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'));

    await user.click(screen.getByRole('button', { name: 'Copy' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('copy it manually');
  });

  it('shows the API error when generating fails, and can try again', async () => {
    let attempt = 0;
    mockApi(() => (++attempt === 1 ? fail(429, 'Too many requests, slow down.') : ok(template)));
    render(<DraftEditor discussionId="d1" />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Generate suggestion' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Too many requests');
    await user.click(screen.getByRole('button', { name: 'Generate suggestion' }));
    expect(await screen.findByRole('textbox', { name: 'Your reply' })).toBeInTheDocument();
  });

  it('keeps the text and shows an error when saving fails', async () => {
    mockApi((url, init) =>
      url.endsWith('/generate')
        ? ok(template)
        : init.method === 'POST'
          ? fail(500, 'Something went wrong')
          : ok(savedDraft),
    );
    render(<DraftEditor discussionId="d1" />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Generate suggestion' }));
    await user.click(await screen.findByRole('button', { name: 'Save draft' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong');
    expect(screen.getByRole('textbox', { name: 'Your reply' })).toHaveValue(
      template.suggestedReply,
    );
  });

  it('cannot save an empty reply', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Generate suggestion' }));
    await user.clear(await screen.findByRole('textbox', { name: 'Your reply' }));
    expect(screen.getByRole('button', { name: 'Save draft' })).toBeDisabled();
  });
});
