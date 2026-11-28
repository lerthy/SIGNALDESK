import type { SupabaseClient } from '@supabase/supabase-js';
import type { DraftChanges, NewDraft, Tone } from '../schemas/draft.schema.js';
import type { Draft } from '../types/draft.js';

export interface DraftRepository {
  list(): Promise<Draft[]>;
  create(draft: NewDraft): Promise<Draft>;
  /** Null when no draft has this id. */
  update(id: string, changes: DraftChanges): Promise<Draft | null>;
  /** False when no draft has this id. */
  remove(id: string): Promise<boolean>;
}

// `discussions(...)` joins the source discussion through the foreign key, so one query is enough.
// The client has no generated types and guesses a to-many join (an array), so each query states the real row type.
const COLUMNS =
  'id, discussion_id, draft_text, tone, status, ai_provider, created_at, updated_at, discussions(source, content)';

interface DraftRow {
  id: string;
  discussion_id: string | null;
  draft_text: string;
  tone: Tone;
  status: Draft['status'];
  ai_provider: Draft['aiProvider'];
  created_at: string;
  updated_at: string;
  discussions: { source: string; content: string } | null;
}

function toDraft(row: DraftRow): Draft {
  return {
    id: row.id,
    discussionId: row.discussion_id,
    draftText: row.draft_text,
    tone: row.tone,
    status: row.status,
    aiProvider: row.ai_provider,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    discussion: row.discussions,
  };
}

export function createDraftRepository(db: SupabaseClient): DraftRepository {
  return {
    async list() {
      const { data, error } = await db
        .from('drafts')
        .select(COLUMNS)
        .order('created_at', { ascending: false })
        .overrideTypes<DraftRow[]>();
      if (error) throw new Error(`Failed to load drafts: ${error.message}`);
      return data.map(toDraft);
    },

    async create(draft) {
      const { data, error } = await db
        .from('drafts')
        .insert({
          discussion_id: draft.discussionId,
          draft_text: draft.draftText,
          tone: draft.tone,
          ai_provider: draft.aiProvider,
        })
        .select(COLUMNS)
        .single<DraftRow>();
      if (error) throw new Error(`Failed to save draft: ${error.message}`);
      return toDraft(data);
    },

    async update(id, changes) {
      const { data, error } = await db
        .from('drafts')
        .update({
          ...(changes.draftText !== undefined && { draft_text: changes.draftText }),
          ...(changes.status !== undefined && { status: changes.status }),
        })
        .eq('id', id)
        .select(COLUMNS)
        .maybeSingle<DraftRow>();
      if (error) throw new Error(`Failed to update draft: ${error.message}`);
      return data ? toDraft(data) : null;
    },

    async remove(id) {
      const { data, error } = await db.from('drafts').delete().eq('id', id).select('id');
      if (error) throw new Error(`Failed to delete draft: ${error.message}`);
      return data.length > 0;
    },
  };
}
