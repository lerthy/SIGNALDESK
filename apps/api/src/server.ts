import { createApp } from './app.js';
import { loadEnv } from './config/env.js';
import { createSupabaseClient } from './config/supabase.js';
import { createGroqProvider } from './providers/ai/groq.provider.js';
import { createDiscussionRepository } from './repositories/discussions.repository.js';
import { createDraftRepository } from './repositories/drafts.repository.js';

const env = loadEnv();
// loadEnv guarantees GROQ_MODEL exists whenever GROQ_API_KEY does.
const ai =
  env.GROQ_API_KEY && env.GROQ_MODEL
    ? createGroqProvider({ apiKey: env.GROQ_API_KEY, model: env.GROQ_MODEL })
    : null;

const db = createSupabaseClient(env);
const app = createApp({
  env,
  discussions: createDiscussionRepository(db),
  drafts: createDraftRepository(db),
  ai,
});

// Render requires binding to 0.0.0.0 and the PORT it provides.
app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`SignalDesk API listening on port ${env.PORT}`);
  console.log(
    ai ? `AI provider: Groq (${env.GROQ_MODEL})` : 'AI provider: none, using template fallback',
  );
});
