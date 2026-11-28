import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockApi, ok } from '../test/mockApi';
import { App } from './App';

const discussion = {
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

beforeEach(() => {
  localStorage.clear();
  mockApi((url) =>
    url.includes('/api/stats')
      ? ok({
          discussions: 18,
          drafts: { draft: 0, reviewed: 0, dismissed: 0 },
          aiProvider: 'template',
        })
      : ok([discussion]),
  );
});
afterEach(() => vi.unstubAllGlobals());

async function searchExclusions(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Discussions' }));
  await user.type(
    screen.getByRole('textbox', { name: /keywords or hashtags/i }),
    'exclusions{Enter}',
  );
  await screen.findByText(/1 discussion for/);
}

describe('App navigation', () => {
  it('opens on the overview', async () => {
    render(<App />);
    expect(await screen.findByText('Discussions available')).toBeInTheDocument();
  });

  it('keeps search results and the typed text when you visit another page and come back', async () => {
    render(<App />);
    const user = userEvent.setup();
    await searchExclusions(user);

    await user.click(screen.getByRole('button', { name: 'About' }));
    expect(screen.getByRole('heading', { name: 'About SignalDesk' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Discussions' }));

    expect(screen.getByText(/1 discussion for/)).toBeVisible();
    expect(screen.getByRole('textbox', { name: /keywords or hashtags/i })).toHaveValue(
      'exclusions',
    );
  });

  it('runs a recent search from the overview in the discussions page', async () => {
    render(<App />);
    const user = userEvent.setup();
    await searchExclusions(user);

    await user.click(screen.getByRole('button', { name: 'Overview' }));
    await user.click(await screen.findByRole('button', { name: 'exclusions' }));

    expect(await screen.findByText(/1 discussion for/)).toBeVisible();
    expect(screen.getByRole('textbox', { name: /keywords or hashtags/i })).toHaveValue(
      'exclusions',
    );
  });
});
