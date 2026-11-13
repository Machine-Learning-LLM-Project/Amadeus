-- Initial schema for Amadeus. Mirrors the Zod schemas in shared/schemas/ (snake_case here,
-- camelCase in TypeScript; see shared/db.ts for the row <-> object mappers).
--
-- Access model (see AGENTS.md):
--   * New tables are NOT exposed to the Data API automatically. Each table below explicitly
--     grants what the `authenticated` role may do. `anon` (signed-out) gets nothing.
--   * Row Level Security is on for every table. Users can only see and change their own rows.
--   * usage_log is written only by edge functions (service role); users may read their own rows.

-- ---------------------------------------------------------------------------
-- user_preferences: one row per user, used by the scheduler and checker
-- ---------------------------------------------------------------------------
create table public.user_preferences (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  timezone text not null,
  day_start time not null default '08:00',
  day_end time not null default '22:00',
  buffer_minutes integer not null default 10 check (buffer_minutes between 0 and 120),
  max_session_minutes integer not null default 90 check (max_session_minutes between 15 and 480),
  created_at timestamptz not null default now(),
  check (day_end > day_start)
);

-- ---------------------------------------------------------------------------
-- tasks: things to get done before a deadline
-- ---------------------------------------------------------------------------
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  description text check (char_length(description) <= 2000),
  course text check (char_length(course) <= 100),
  due_at timestamptz not null,
  estimated_minutes integer check (estimated_minutes > 0),
  splittable boolean not null default true,
  min_session_minutes integer check (min_session_minutes > 0),
  priority smallint check (priority between 1 and 5),
  status text not null default 'todo' check (status in ('todo', 'scheduled', 'done', 'dropped')),
  source text not null default 'manual' check (source in ('manual', 'canvas', 'synthetic')),
  created_at timestamptz not null default now(),
  -- lets schedule_blocks reference (task id, owner) so a block can't point at someone else's task
  unique (id, user_id)
);

create index tasks_user_due_idx on public.tasks (user_id, due_at);

-- ---------------------------------------------------------------------------
-- class_meetings: weekly classes between term_start and term_end
-- ---------------------------------------------------------------------------
create table public.class_meetings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  location text check (char_length(location) <= 100),
  days text[] not null check (
    cardinality(days) > 0
    and days <@ array['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
  ),
  start_time time not null,
  end_time time not null,
  term_start date not null,
  term_end date not null,
  created_at timestamptz not null default now(),
  check (end_time > start_time),
  check (term_end >= term_start)
);

create index class_meetings_user_idx on public.class_meetings (user_id);

-- ---------------------------------------------------------------------------
-- commitments: one-off fixed events (club meeting, shift, dinner)
-- ---------------------------------------------------------------------------
create table public.commitments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  kind text not null check (kind in ('extracurricular', 'personal', 'meal', 'break', 'other')),
  start_at timestamptz not null,
  end_at timestamptz not null,
  created_at timestamptz not null default now(),
  check (end_at > start_at)
);

create index commitments_user_start_idx on public.commitments (user_id, start_at);

-- ---------------------------------------------------------------------------
-- schedule_blocks: placed work sessions (proposed / accepted / rejected)
-- ---------------------------------------------------------------------------
create table public.schedule_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  task_id uuid not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  session_index integer not null check (session_index >= 1),
  session_count integer not null check (session_count >= 1),
  status text not null default 'proposed' check (status in ('proposed', 'accepted', 'rejected')),
  ai_generated boolean not null default true,
  created_at timestamptz not null default now(),
  check (end_at > start_at),
  check (session_index <= session_count),
  foreign key (task_id, user_id) references public.tasks (id, user_id) on delete cascade
);

create index schedule_blocks_user_start_idx on public.schedule_blocks (user_id, start_at);
create index schedule_blocks_task_idx on public.schedule_blocks (task_id, user_id);

-- ---------------------------------------------------------------------------
-- usage_log: one row per model call (written by edge functions with the service role)
-- ---------------------------------------------------------------------------
create table public.usage_log (
  id uuid primary key default gen_random_uuid(),
  -- null for eval runs not tied to a signed-in user
  user_id uuid references auth.users (id) on delete set null,
  feature text not null check (
    feature in ('estimate', 'prioritize', 'explain', 'adjust', 'brief', 'baseline', 'guardrail')
  ),
  model text not null,
  mode text not null check (mode in ('mock', 'live')),
  input_tokens integer not null check (input_tokens >= 0),
  output_tokens integer not null check (output_tokens >= 0),
  latency_ms integer not null check (latency_ms >= 0),
  cost_usd numeric(12, 6) not null check (cost_usd >= 0),
  attempt integer not null default 1 check (attempt >= 1),
  ok boolean not null,
  error text,
  created_at timestamptz not null default now()
);

-- the $8 monthly block sums cost by month across the whole team
create index usage_log_created_idx on public.usage_log (created_at);
create index usage_log_user_idx on public.usage_log (user_id);

-- ---------------------------------------------------------------------------
-- Privileges: nothing for anon; explicit grants for signed-in users
-- ---------------------------------------------------------------------------
revoke all on table
  public.user_preferences, public.tasks, public.class_meetings,
  public.commitments, public.schedule_blocks, public.usage_log
from anon, authenticated;

grant select, insert, update, delete on table
  public.user_preferences, public.tasks, public.class_meetings,
  public.commitments, public.schedule_blocks
to authenticated;

grant select on table public.usage_log to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security: each user sees and changes only their own rows.
-- (select auth.uid()) is evaluated once per query instead of once per row.
-- ---------------------------------------------------------------------------
alter table public.user_preferences enable row level security;
alter table public.tasks enable row level security;
alter table public.class_meetings enable row level security;
alter table public.commitments enable row level security;
alter table public.schedule_blocks enable row level security;
alter table public.usage_log enable row level security;

-- user_preferences
create policy "Users read own preferences" on public.user_preferences
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users insert own preferences" on public.user_preferences
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users update own preferences" on public.user_preferences
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users delete own preferences" on public.user_preferences
  for delete to authenticated using ((select auth.uid()) = user_id);

-- tasks
create policy "Users read own tasks" on public.tasks
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users insert own tasks" on public.tasks
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users update own tasks" on public.tasks
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users delete own tasks" on public.tasks
  for delete to authenticated using ((select auth.uid()) = user_id);

-- class_meetings
create policy "Users read own classes" on public.class_meetings
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users insert own classes" on public.class_meetings
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users update own classes" on public.class_meetings
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users delete own classes" on public.class_meetings
  for delete to authenticated using ((select auth.uid()) = user_id);

-- commitments
create policy "Users read own commitments" on public.commitments
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users insert own commitments" on public.commitments
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users update own commitments" on public.commitments
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users delete own commitments" on public.commitments
  for delete to authenticated using ((select auth.uid()) = user_id);

-- schedule_blocks (the composite foreign key also stops blocks pointing at another user's task)
create policy "Users read own blocks" on public.schedule_blocks
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users insert own blocks" on public.schedule_blocks
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users update own blocks" on public.schedule_blocks
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users delete own blocks" on public.schedule_blocks
  for delete to authenticated using ((select auth.uid()) = user_id);

-- usage_log: read-only for users; inserts come from edge functions using the service role
create policy "Users read own usage" on public.usage_log
  for select to authenticated using ((select auth.uid()) = user_id);
