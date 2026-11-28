-- The AI provider changed from OpenAI to Groq. The drafts table is still empty, so no data rewrite is needed.
alter table public.drafts drop constraint drafts_ai_provider_check;
alter table public.drafts add constraint drafts_ai_provider_check
  check (ai_provider in ('groq', 'template'));
