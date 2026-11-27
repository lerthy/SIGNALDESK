import { createClient } from '@supabase/supabase-js';
import type { Env } from './env.js';

// The secret key bypasses RLS, so this client must only ever be created on the server.
export function createSupabaseClient(env: Pick<Env, 'SUPABASE_URL' | 'SUPABASE_SECRET_KEY'>) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false },
  });
}
