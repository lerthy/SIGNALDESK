import type { SupabaseClient } from '@supabase/supabase-js';
import type { Discussion } from '../types/discussion.js';

export interface DiscussionRepository {
  listDemo(): Promise<Discussion[]>;
}

export function createDiscussionRepository(db: SupabaseClient): DiscussionRepository {
  return {
    // shortcut: loads every demo row (~20) and filters in memory, move filtering into SQL if the dataset grows.
    async listDemo() {
      const { data, error } = await db
        .from('discussions')
        .select('id, source, content, tags, published_at, is_synthetic')
        .eq('is_synthetic', true);

      if (error) throw new Error(`Failed to load discussions: ${error.message}`);

      return data.map((row) => ({
        id: row.id,
        source: row.source,
        content: row.content,
        tags: row.tags,
        publishedAt: row.published_at,
        isSynthetic: row.is_synthetic,
        url: null,
      }));
    },
  };
}
