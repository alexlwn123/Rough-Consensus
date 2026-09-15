-- Rollback ONLY before Convex accepts application writes, or after a verified
-- reverse reconciliation. Restoring the frontend alone would lose new writes.
begin;
do $$
declare target text;
begin
  foreach target in array array['public.debates', 'public.votes', 'public.debate_access',
    'public.user_roles', 'auth.users', 'auth.identities']
  loop
    execute format('drop trigger if exists convex_migration_freeze on %s', target);
  end loop;
end;
$$;
drop function if exists public.convex_migration_read_only();
commit;
