drop policy "Admins can manage all roles" on "public"."user_roles";

drop policy "Users can view their own roles" on "public"."user_roles";

drop policy "Admins can update any debate" on "public"."debates";

drop function if exists "public"."check_if_user_is_admin"(user_uuid uuid);

create policy "Only admins can delete roles"
on "public"."user_roles"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM user_roles user_roles_1
  WHERE ((user_roles_1.user_id = auth.uid()) AND (user_roles_1.role = 'admin'::text)))));


create policy "Only admins can insert new roles"
on "public"."user_roles"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM user_roles user_roles_1
  WHERE ((user_roles_1.user_id = auth.uid()) AND (user_roles_1.role = 'admin'::text)))));


create policy "Only admins can update roles"
on "public"."user_roles"
as permissive
for update
to authenticated
using ((EXISTS ( SELECT 1
   FROM user_roles user_roles_1
  WHERE ((user_roles_1.user_id = auth.uid()) AND (user_roles_1.role = 'admin'::text)))));


create policy "User roles are viewable by the user themselves and admins"
on "public"."user_roles"
as permissive
for select
to authenticated
using (((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM user_roles user_roles_1
  WHERE ((user_roles_1.user_id = auth.uid()) AND (user_roles_1.role = 'admin'::text))))));


create policy "Admins can update any debate"
on "public"."debates"
as permissive
for update
to authenticated
using ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::text)))));



