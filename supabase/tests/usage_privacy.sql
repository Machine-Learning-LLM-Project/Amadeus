-- Run against a LOCAL synthetic Supabase database after applying the migration.
-- Every insert is rolled back. No real users, API calls, emails, or keys.
begin;
insert into auth.users(id) values
  ('00000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000002');
insert into public.llm_usage_log(id, user_id, feature, model, mode, attempt) values
  ('00000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000001', 'brief', 'gpt-6-luna', 'mock', 1),
  ('00000000-0000-4000-8000-000000000012', '00000000-0000-4000-8000-000000000002', 'brief', 'gpt-6-luna', 'mock', 1),
  ('00000000-0000-4000-8000-000000000013', null, 'baseline', 'gpt-6-luna', 'mock', 1);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);
do $$
begin
  if (select count(*) from public.llm_usage_log) <> 1 then raise exception 'privacy: wrong visible row count'; end if;
  if exists (select 1 from public.llm_usage_log where user_id is distinct from auth.uid()) then
    raise exception 'privacy: foreign or eval data visible';
  end if;
  begin
    insert into public.llm_usage_log(id, feature, model, mode, attempt)
    values (gen_random_uuid(), 'brief', 'gpt-6-luna', 'mock', 1);
    raise exception 'privacy: client can write usage';
  exception when insufficient_privilege then null;
  end;
  if has_function_privilege('authenticated', 'public.reserve_llm_usage(jsonb,numeric)', 'execute')
    or has_function_privilege('authenticated', 'public.finish_llm_usage(jsonb,boolean)', 'execute') then
    raise exception 'privacy: client can invoke accounting functions';
  end if;
end;
$$;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', true);
do $$
begin
  if (select count(*) from public.llm_usage_log) <> 1 then raise exception 'privacy: second user cannot read own usage'; end if;
end;
$$;
reset role;
set local role anon;
do $$
begin
  begin
    perform count(*) from public.llm_usage_log;
    raise exception 'privacy: anonymous access allowed';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;
rollback;
