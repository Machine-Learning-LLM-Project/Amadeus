-- Bayasaa's usage table only. Fernando owns deployment and the other app tables.
create table public.llm_usage_log (
  id uuid primary key,
  user_id uuid references auth.users(id) on delete set null,
  feature text not null check (feature in ('estimate', 'prioritize', 'explain', 'adjust', 'brief', 'baseline', 'guardrail')),
  model text not null check (model = 'gpt-6-luna'),
  mode text not null check (mode in ('mock', 'live')),
  input_tokens integer not null default 0 check (input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  latency_ms integer not null default 0 check (latency_ms >= 0),
  cost_usd numeric(20,9) not null default 0 check (cost_usd >= 0 and cost_usd < 'Infinity'::numeric),
  reserved_usd numeric(20,9) not null default 0 check (reserved_usd >= 0 and reserved_usd < 'Infinity'::numeric),
  attempt integer not null check (attempt between 1 and 3),
  ok boolean not null default false,
  error text check (error in (
    'invalid_output', 'invalid_task_reference', 'instruction_attempt', 'sensitive_input',
    'input_too_long', 'provider_usage_unknown', 'provider_token_bound_exceeded', 'model_call_failed'
  )),
  completed boolean not null default false,
  usage_known boolean not null default false,
  created_at timestamptz not null default now(),
  check (mode <> 'mock' or (cost_usd = 0 and reserved_usd = 0 and input_tokens = 0 and output_tokens = 0))
);

create index llm_usage_log_month on public.llm_usage_log(created_at);
create index llm_usage_log_user on public.llm_usage_log(user_id);
alter table public.llm_usage_log enable row level security;
revoke all on public.llm_usage_log from public, anon, authenticated;
grant select on public.llm_usage_log to authenticated;
grant all on public.llm_usage_log to service_role;
create policy "Read own usage only" on public.llm_usage_log
  for select to authenticated using ((select auth.uid()) = user_id);

-- All callers, including eval, share one budget. Lock serializes the check+insert.
-- Holds from older months remain counted until reconciled: a timed-out call may
-- finish after midnight. Completed costs are counted in the request's UTC month.
create function public.reserve_llm_usage(p_entry jsonb, p_reserved_usd numeric)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  month_start timestamptz := date_trunc('month', now() at time zone 'UTC') at time zone 'UTC';
  committed numeric;
begin
  if p_reserved_usd is null or p_reserved_usd < 0 or p_reserved_usd > 8
    or (p_entry->>'mode' = 'live' and p_reserved_usd = 0) then
    raise exception 'invalid_reservation';
  end if;
  perform pg_advisory_xact_lock(823001);
  select coalesce(sum(case when created_at >= month_start then cost_usd else 0 end), 0)
    + coalesce(sum(reserved_usd), 0) into committed from public.llm_usage_log;
  -- Mock requests remain free and usable when the live budget is exhausted.
  if p_entry->>'mode' = 'live' and committed + p_reserved_usd > 8 then
    return false;
  end if;
  insert into public.llm_usage_log(id, user_id, feature, model, mode, attempt, reserved_usd)
  values ((p_entry->>'id')::uuid, (p_entry->>'userId')::uuid, p_entry->>'feature',
    p_entry->>'model', p_entry->>'mode', (p_entry->>'attempt')::integer, p_reserved_usd);
  return true;
end;
$$;

create function public.finish_llm_usage(p_entry jsonb, p_usage_known boolean)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  previous public.llm_usage_log;
begin
  perform pg_advisory_xact_lock(823001);
  select * into strict previous from public.llm_usage_log where id = (p_entry->>'id')::uuid for update;
  if previous.completed then raise exception 'usage_already_finished'; end if;
  if p_usage_known is null or previous.mode <> p_entry->>'mode'
    or previous.model <> p_entry->>'model' or previous.feature <> p_entry->>'feature'
    or previous.user_id is distinct from (p_entry->>'userId')::uuid
    or previous.attempt <> (p_entry->>'attempt')::integer then
    raise exception 'usage_metadata_mismatch';
  end if;
  update public.llm_usage_log set
    input_tokens = (p_entry->>'inputTokens')::integer,
    output_tokens = (p_entry->>'outputTokens')::integer,
    latency_ms = (p_entry->>'latencyMs')::integer,
    cost_usd = (p_entry->>'costUsd')::numeric,
    reserved_usd = case when p_usage_known then 0 else reserved_usd end,
    ok = (p_entry->>'ok')::boolean,
    error = p_entry->>'error',
    completed = true,
    usage_known = p_usage_known
  where id = previous.id;
  return true;
end;
$$;

revoke all on function public.reserve_llm_usage(jsonb, numeric) from public, anon, authenticated;
revoke all on function public.finish_llm_usage(jsonb, boolean) from public, anon, authenticated;
grant execute on function public.reserve_llm_usage(jsonb, numeric) to service_role;
grant execute on function public.finish_llm_usage(jsonb, boolean) to service_role;
