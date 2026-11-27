import { createApp } from './app.js';
import { loadEnv } from './config/env.js';
import { createSupabaseClient } from './config/supabase.js';
import { createDiscussionRepository } from './repositories/discussions.repository.js';

const env = loadEnv();
const app = createApp({
  env,
  discussions: createDiscussionRepository(createSupabaseClient(env)),
});

// Render requires binding to 0.0.0.0 and the PORT it provides.
app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`SignalDesk API listening on port ${env.PORT}`);
});
