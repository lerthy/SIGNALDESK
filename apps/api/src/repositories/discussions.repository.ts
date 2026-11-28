import type { SupabaseClient } from '@supabase/supabase-js';
import type { Discussion } from '../types/discussion.js';

export interface DiscussionRepository {
  listDemo(): Promise<Discussion[]>;
  findDemoById(id: string): Promise<Discussion | null>;
  countDemo(): Promise<number>;
}

const COLUMNS = 'id, source, content, tags, published_at, is_synthetic';

// The client has no generated row types, so we describe the columns we select and map snake_case here.
interface DiscussionRow {
  id: string;
  source: string;
  content: string;
  tags: string[];
  published_at: string;
  is_synthetic: boolean;
}

function toDiscussion(row: DiscussionRow): Discussion {
  return {
    id: row.id,
    source: row.source,
    content: row.content,
    tags: row.tags,
    publishedAt: row.published_at,
    isSynthetic: row.is_synthetic,
    url: null,
  };
}

export function createDiscussionRepository(db: SupabaseClient): DiscussionRepository {
  return {
    // shortcut: loads every demo row (~20) and filters in memory, move filtering into SQL if the dataset grows.
    async listDemo() {
      const { data, error } = await db.from('discussions').select(COLUMNS).eq('is_synthetic', true);
      if (error) throw new Error(`Failed to load discussions: ${error.message}`);
      return data.map(toDiscussion);
    },

    async countDemo() {
      const { count, error } = await db
        .from('discussions')
        .select('id', { count: 'exact', head: true })
        .eq('is_synthetic', true);
      if (error) throw new Error(`Failed to count discussions: ${error.message}`);
      return count ?? 0;
    },

    async findDemoById(id) {
      const { data, error } = await db
        .from('discussions')
        .select(COLUMNS)
        .eq('id', id)
        .eq('is_synthetic', true)
        .maybeSingle();
      if (error) throw new Error(`Failed to load discussion: ${error.message}`);
      return data ? toDiscussion(data) : null;
    },
  };
}
