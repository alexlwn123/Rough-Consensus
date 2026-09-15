-- Run as database owner in Supabase SQL Editor. Download the single result as CSV.
-- One SELECT gives a consistent snapshot; excludes passwords and session/provider tokens.
select jsonb_build_object(
  'sourceProject', 'jrgrsjkuihhsnwxcbwzn',
  'exportedAt', now(),
  'debates', (select coalesce(jsonb_agg(to_jsonb(t) order by t.id), '[]') from public.debates t),
  'votes', (select coalesce(jsonb_agg(to_jsonb(t) order by t.id), '[]') from public.votes t),
  'user_roles', (select coalesce(jsonb_agg(to_jsonb(t) order by t.id), '[]') from public.user_roles t),
  'debate_access', (select coalesce(jsonb_agg(to_jsonb(t) order by t.id), '[]') from public.debate_access t),
  'users', (select coalesce(jsonb_agg(to_jsonb(t) order by t.id), '[]') from (
    select id, email, created_at, is_anonymous,
      raw_user_meta_data->>'full_name' as full_name, raw_user_meta_data->>'name' as name
    from auth.users
  ) t),
  'identities', (select coalesce(jsonb_agg(to_jsonb(t) order by t.id), '[]') from (
    select id, user_id, provider, provider_id, identity_data->>'sub' as subject from auth.identities
  ) t),
  'results', (select coalesce(jsonb_agg(jsonb_build_object(
    'id', id, 'counts', public.get_debate_vote_counts(id), 'result', public.get_debate_result_data(id)
  ) order by id), '[]') from public.debates),
  'policies', (select coalesce(jsonb_agg(to_jsonb(p)), '[]') from pg_policies p where schemaname='public'),
  'columns', (select coalesce(jsonb_agg(to_jsonb(c)), '[]') from information_schema.columns c where table_schema='public')
) as snapshot;
