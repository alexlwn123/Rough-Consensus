create type "public"."Debate Phase" as enum ('pre', 'post', 'scheduled', 'finished', 'ongoing');

drop function if exists "public"."get_debate_sankey_data"(debate_id uuid);

drop function if exists "public"."get_debate_vote_counts"(debate_id uuid);

alter table "public"."debates" alter column "current_phase" drop default;

alter table "public"."debates" alter column "current_phase" set data type "Debate Phase" using "current_phase"::text::"Debate Phase";

alter table "public"."debates" alter column "current_phase" set default 'scheduled'::"Debate Phase";

drop type "public"."Debase Phase";


