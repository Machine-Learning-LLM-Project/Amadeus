-- The project was created with "Enable automatic RLS", which installs the event trigger
-- function public.rls_auto_enable(). Because it lives in the public schema, the Data API
-- exposes it as /rest/v1/rpc/rls_auto_enable (Supabase security advisor lints 0028/0029).
-- Only the event trigger needs it, so take away EXECUTE from everyone but the owner.
-- (Skipped where the function doesn't exist, e.g. a fresh local stack.)
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end
$$;

-- Self-check: the event trigger must still turn RLS on for new tables after the revoke.
-- If it doesn't, this raises and the whole migration rolls back.
do $$
declare
  rls_on boolean;
begin
  if exists (select 1 from pg_event_trigger where evtname = 'ensure_rls') then
    create table public._rls_auto_enable_check (id int);
    select relrowsecurity into rls_on from pg_class where oid = 'public._rls_auto_enable_check'::regclass;
    drop table public._rls_auto_enable_check;
    if not rls_on then
      raise exception 'automatic RLS stopped working after revoking EXECUTE on rls_auto_enable()';
    end if;
  end if;
end
$$;
