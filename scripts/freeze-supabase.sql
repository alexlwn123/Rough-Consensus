-- Cutover only: install immediately before the final source snapshot.
-- The transaction drains in-flight writes and closes every application/identity
-- write path, including old browser sessions and service-role API requests.
begin;
lock table public.debates, public.votes, public.debate_access, public.user_roles,
  auth.users, auth.identities in share row exclusive mode;

do $$
begin
  if exists (select 1 from public.debates where not is_deleted and current_phase in ('pre', 'ongoing', 'post')) then
    raise exception 'An active debate prevents cutover; choose a between-events window';
  end if;
end;
$$;

create or replace function public.convex_migration_read_only()
returns trigger language plpgsql as $$
begin
  raise exception 'This application has moved to Convex. Refresh the website before making changes.'
    using errcode = '55000';
end;
$$;

do $$
declare target text;
begin
  foreach target in array array['public.debates', 'public.votes', 'public.debate_access',
    'public.user_roles', 'auth.users', 'auth.identities']
  loop
    execute format('create or replace trigger convex_migration_freeze before insert or update or delete or truncate on %s for each statement execute function public.convex_migration_read_only()', target);
  end loop;
end;
$$;
commit;

select event_object_schema, event_object_table, event_manipulation, action_timing
from information_schema.triggers where trigger_name = 'convex_migration_freeze'
order by event_object_schema, event_object_table, event_manipulation;
