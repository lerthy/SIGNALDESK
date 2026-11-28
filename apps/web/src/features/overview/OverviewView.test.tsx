import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addRecentSearch } from '../../lib/recentSearches';
import { fail, mockApi, ok } from '../../test/mockApi';
import type { Stats } from '../../types/draft';
import { OverviewView } from './OverviewView';

const stats: Stats = {
  discussions: 18,
  drafts: { draft: 2, reviewed: 1, dismissed: 0 },
  aiProvider: 'groq',
};

beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

const valueOf = (label: string) => screen.getByText(label).parentElement;

describe('OverviewView', () => {
  it('shows numbers from the API, with the mode and AI provider', async () => {
    mockApi(() => ok(stats));
    render(<OverviewView onSearch={() => undefined} />);

    expect(await screen.findByText('Demo data: synthetic discussions')).toBeInTheDocument();
    expect(screen.getByText('AI-generated with Groq')).toBeInTheDocument();
    expect(valueOf('Discussions available')).toHaveTextContent('18');
    expect(valueOf('Saved drafts')).toHaveTextContent('3');
    expect(valueOf('Awaiting review')).toHaveTextContent('2');
    expect(valueOf('Reviewed')).toHaveTextContent('1');
    expect(valueOf('Dismissed')).toHaveTextContent('0');
  });

  it('says so when replies come from the template fallback', async () => {
    mockApi(() => ok({ ...stats, aiProvider: 'template' }));
    render(<OverviewView onSearch={() => undefined} />);
    expect(await screen.findByText(/Template fallback/)).toBeInTheDocument();
  });

  it('lists recent searches and runs one when clicked', async () => {
    addRecentSearch('policy exclusions');
    addRecentSearch('term life');
    mockApi(() => ok(stats));
    const onSearch = vi.fn();
    render(<OverviewView onSearch={onSearch} />);

    await screen.findByText('Recent searches');
    await userEvent.setup().click(screen.getByRole('button', { name: 'policy exclusions' }));
    expect(onSearch).toHaveBeenCalledWith('policy exclusions');
  });

  it('explains where searches will appear when there are none yet', async () => {
    mockApi(() => ok(stats));
    render(<OverviewView onSearch={() => undefined} />);
    expect(await screen.findByText(/kept in this browser only/)).toBeInTheDocument();
  });

  it('shows an error state when the API is unavailable', async () => {
    mockApi(() => fail(500, 'Something went wrong'));
    render(<OverviewView onSearch={() => undefined} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong');
  });
});
