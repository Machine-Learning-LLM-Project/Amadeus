-- Local-only, transactional accounting checks. No model calls.
begin;
-- Synthetic test rows must not mix with preexisting local usage.
delete from public.llm_usage_log;
do $$
declare
  entry jsonb := jsonb_build_object('id', '00000000-0000-4000-8000-000000000021',
    'userId', null, 'feature', 'baseline', 'model', 'gpt-6-luna', 'mode', 'live', 'attempt', 1);
  next_entry jsonb;
begin
  if not public.reserve_llm_usage(entry, 8) then raise exception 'budget: initial reserve failed'; end if;
  next_entry := entry || jsonb_build_object('id', '00000000-0000-4000-8000-000000000022');
  if public.reserve_llm_usage(next_entry, 0.001) then raise exception 'budget: double spending allowed'; end if;
  entry := entry || jsonb_build_object('inputTokens', 10, 'outputTokens', 5,
    'latencyMs', 10, 'costUsd', 8, 'ok', true, 'error', null);
  perform public.finish_llm_usage(entry, true);
  if public.reserve_llm_usage(next_entry, 0.001) then raise exception 'budget: paid call allowed at limit'; end if;
  if not public.reserve_llm_usage(next_entry || '{"mode":"mock"}'::jsonb, 0) then
    raise exception 'budget: free mock blocked';
  end if;
end;
$$;
delete from public.llm_usage_log;
do $$
declare
  entry jsonb := jsonb_build_object('id', '00000000-0000-4000-8000-000000000023',
    'userId', null, 'feature', 'baseline', 'model', 'gpt-6-luna', 'mode', 'live', 'attempt', 1);
begin
  perform public.reserve_llm_usage(entry, 0.5);
  perform public.finish_llm_usage(entry || jsonb_build_object('inputTokens', 0, 'outputTokens', 0,
    'latencyMs', 10, 'costUsd', 0, 'ok', false, 'error', 'model_call_failed'), false);
  if (select reserved_usd from public.llm_usage_log where id = (entry->>'id')::uuid) <> 0.5 then
    raise exception 'budget: uncertain charge released';
  end if;
  update public.llm_usage_log set created_at = now() - interval '2 months';
  if public.reserve_llm_usage(entry || jsonb_build_object('id', gen_random_uuid()), 8) then
    raise exception 'budget: old unresolved hold ignored';
  end if;
  update public.llm_usage_log set reserved_usd = 0, cost_usd = 8, usage_known = true;
  if not public.reserve_llm_usage(entry || jsonb_build_object('id', gen_random_uuid()), 8) then
    raise exception 'budget: old completed cost prevented monthly reset';
  end if;
end;
$$;
rollback;
