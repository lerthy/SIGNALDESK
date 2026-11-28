import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addRecentSearch, getRecentSearches } from './recentSearches';

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe('recent searches', () => {
  it('keeps the newest first, removes repeats and stops at five', () => {
    for (const query of ['a1', 'b2', 'c3', 'd4', 'e5', 'f6']) addRecentSearch(query);
    addRecentSearch('c3');
    expect(getRecentSearches()).toEqual(['c3', 'f6', 'e5', 'd4', 'b2']);
  });

  it('ignores corrupted or unexpected stored data', () => {
    localStorage.setItem('signaldesk.recentSearches', '{not json');
    expect(getRecentSearches()).toEqual([]);
    localStorage.setItem('signaldesk.recentSearches', JSON.stringify({ a: 1 }));
    expect(getRecentSearches()).toEqual([]);
    localStorage.setItem('signaldesk.recentSearches', JSON.stringify(['ok', 5, null]));
    expect(getRecentSearches()).toEqual(['ok']);
  });

  it('never breaks searching when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => addRecentSearch('term life')).not.toThrow();
    expect(getRecentSearches()).toEqual([]);
  });
});
