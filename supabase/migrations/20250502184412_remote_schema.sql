drop function if exists "public"."get_debate_sankey_data"(debate_id uuid);

drop function if exists "public"."get_debate_vote_counts"(debate_id uuid);

alter table "public"."debates" alter column "current_phase" drop default;

alter type "public"."Debase Phase" rename to "Debase Phase__old_version_to_be_dropped";

create type "public"."Debase Phase" as enum ('pre', 'post', 'scheduled', 'finished', 'ongoing');

alter table "public"."debates" alter column current_phase type "public"."Debase Phase" using current_phase::text::"public"."Debase Phase";

alter table "public"."debates" alter column "current_phase" set default 'scheduled'::"Debase Phase";

drop type "public"."Debase Phase__old_version_to_be_dropped";

alter table "public"."debates" add column "con_description" text;

alter table "public"."debates" add column "is_deleted" boolean not null default false;

alter table "public"."debates" add column "motion" text;

alter table "public"."debates" add column "pro_description" text;


