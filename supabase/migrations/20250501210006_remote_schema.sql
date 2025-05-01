create type "public"."Debase Phase" as enum ('pre', 'post', 'scheduled', 'finished');

drop policy "User roles are viewable by the user themselves and admins" on "public"."user_roles";

alter table "public"."debates" alter column "current_phase" set default 'scheduled'::"Debase Phase";

alter table "public"."debates" alter column "current_phase" set data type "Debase Phase" using "current_phase"::"Debase Phase";

create policy "Enable users to view their own data only"
on "public"."user_roles"
as permissive
for select
to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));



