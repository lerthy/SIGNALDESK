-- Synthetic demo discussions. Live (Bluesky) posts are never stored here.
create table public.discussions (
  id uuid primary key default gen_random_uuid(),
  source text not null check (length(source) > 0),
  content text not null check (length(content) > 0),
  tags text[] not null default '{}',
  published_at timestamptz not null,
  is_synthetic boolean not null default true,
  created_at timestamptz not null default now()
);

-- Human-reviewed reply drafts. Nothing in this table is ever sent anywhere.
create table public.drafts (
  id uuid primary key default gen_random_uuid(),
  -- Null for live posts: we keep only the public URL, not the post itself.
  discussion_id uuid references public.discussions (id) on delete set null,
  source_url text,
  draft_text text not null check (length(draft_text) between 1 and 2000),
  tone text not null check (tone in ('friendly', 'professional', 'empathetic')),
  status text not null default 'draft' check (status in ('draft', 'reviewed', 'dismissed')),
  ai_provider text not null check (ai_provider in ('openai', 'template')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create function public.set_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger drafts_set_updated_at
  before update on public.drafts
  for each row execute function public.set_updated_at();

-- Only the Express backend (secret key, bypasses RLS) may touch these tables.
-- RLS with no policies denies everyone else; the revoke also hides them from the Data API.
alter table public.discussions enable row level security;
alter table public.drafts enable row level security;
revoke all on public.discussions, public.drafts from anon, authenticated;
