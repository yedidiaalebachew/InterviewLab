create extension if not exists pgcrypto;

create type public.attempt_status as enum (
  'created', 'uploaded', 'transcribing', 'transcribed', 'evaluating', 'completed', 'failed'
);
create type public.feedback_type as enum ('strength', 'improvement');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  prompt text not null,
  category text not null,
  guidance text not null,
  recommended_seconds integer not null default 120 check (recommended_seconds between 30 and 180),
  created_at timestamptz not null default now()
);

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.questions(id),
  attempt_number integer not null check (attempt_number > 0),
  status public.attempt_status not null default 'created',
  audio_path text,
  duration_seconds numeric check (duration_seconds between 0 and 180),
  transcript_text text,
  failure_code text,
  failure_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, question_id, attempt_number)
);

create table public.transcript_segments (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  segment_index integer not null check (segment_index >= 0),
  start_seconds numeric not null check (start_seconds >= 0),
  end_seconds numeric not null check (end_seconds >= start_seconds),
  text text not null check (length(trim(text)) > 0),
  unique (attempt_id, segment_index)
);

create table public.evaluations (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid unique not null references public.attempts(id) on delete cascade,
  overall_score numeric not null check (overall_score between 1 and 5),
  summary text not null,
  prioritized_recommendation text not null,
  next_attempt_outline jsonb not null,
  model_name text,
  prompt_version text not null default 'v1',
  processing_ms integer,
  estimated_cost_usd numeric,
  created_at timestamptz not null default now()
);

create table public.category_scores (
  id uuid primary key default gen_random_uuid(),
  evaluation_id uuid not null references public.evaluations(id) on delete cascade,
  category text not null check (category in ('relevance','structure','specificity','ownership','impact','reflection','concision')),
  score integer not null check (score between 1 and 5),
  explanation text not null,
  unique (evaluation_id, category)
);

create table public.feedback_items (
  id uuid primary key default gen_random_uuid(),
  evaluation_id uuid not null references public.evaluations(id) on delete cascade,
  type public.feedback_type not null,
  category text not null check (category in ('relevance','structure','specificity','ownership','impact','reflection','concision')),
  title text not null,
  explanation text not null,
  suggestion text,
  segment_indexes integer[] not null check (cardinality(segment_indexes) between 1 and 3),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.questions enable row level security;
alter table public.attempts enable row level security;
alter table public.transcript_segments enable row level security;
alter table public.evaluations enable row level security;
alter table public.category_scores enable row level security;
alter table public.feedback_items enable row level security;

create policy "questions are publicly readable" on public.questions for select using (true);
create policy "users read own profile" on public.profiles for select using (auth.uid() = id);
create policy "users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "users manage own attempts" on public.attempts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users read own segments" on public.transcript_segments for select using (
  exists (select 1 from public.attempts where attempts.id = transcript_segments.attempt_id and attempts.user_id = auth.uid())
);
create policy "users insert own segments" on public.transcript_segments for insert with check (
  exists (select 1 from public.attempts where attempts.id = transcript_segments.attempt_id and attempts.user_id = auth.uid())
);
create policy "users delete own segments" on public.transcript_segments for delete using (
  exists (select 1 from public.attempts where attempts.id = transcript_segments.attempt_id and attempts.user_id = auth.uid())
);

create policy "users read own evaluations" on public.evaluations for select using (
  exists (select 1 from public.attempts where attempts.id = evaluations.attempt_id and attempts.user_id = auth.uid())
);
create policy "users read own scores" on public.category_scores for select using (
  exists (
    select 1 from public.evaluations
    join public.attempts on attempts.id = evaluations.attempt_id
    where evaluations.id = category_scores.evaluation_id and attempts.user_id = auth.uid()
  )
);
create policy "users read own feedback" on public.feedback_items for select using (
  exists (
    select 1 from public.evaluations
    join public.attempts on attempts.id = evaluations.attempt_id
    where evaluations.id = feedback_items.evaluation_id and attempts.user_id = auth.uid()
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'interview-audio',
  'interview-audio',
  false,
  15728640,
  array['audio/webm','audio/mp4','audio/mpeg','audio/wav','audio/x-wav']
)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;

create policy "users upload own audio" on storage.objects for insert to authenticated
with check (bucket_id = 'interview-audio' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users read own audio" on storage.objects for select to authenticated
using (bucket_id = 'interview-audio' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users delete own audio" on storage.objects for delete to authenticated
using (bucket_id = 'interview-audio' and (storage.foldername(name))[1] = auth.uid()::text);
