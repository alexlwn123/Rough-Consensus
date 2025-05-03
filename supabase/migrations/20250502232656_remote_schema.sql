alter table "public"."votes" alter column "debate_id" set not null;

alter table "public"."votes" alter column "user_id" set not null;

set check_function_bodies = off;

-- Composite type for before/after counts
CREATE TYPE debate_result_before_after AS (
  pro integer,
  against integer,
  undecided integer
);

-- Composite type for flows
CREATE TYPE debate_result_flows AS (
  proToPro integer,
  proToAgainst integer,
  proToUndecided integer,
  againstToPro integer,
  againstToAgainst integer,
  againstToUndecided integer,
  undecidedToPro integer,
  undecidedToAgainst integer,
  undecidedToUndecided integer
);

-- Composite type for the full result
CREATE TYPE debate_result AS (
  before debate_result_before_after,
  after debate_result_before_after,
  flows debate_result_flows
);

CREATE OR REPLACE FUNCTION public.get_debate_sankey_data(debate_id uuid)
 RETURNS debate_sankey_data
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$DECLARE
  debate_exists BOOLEAN;
  nodes sankey_node[];
  links sankey_link[];
  debate_phase "Debate Phase";
  result debate_sankey_data;
   _debate_id UUID := debate_id;
BEGIN
  -- Check if debate exists and get current phase
  SELECT EXISTS(
    SELECT 1 FROM debates WHERE id = _debate_id
  ),
  (SELECT current_phase FROM debates WHERE id = _debate_id)
  INTO debate_exists, debate_phase;
  
  IF NOT debate_exists THEN
    RAISE EXCEPTION 'Debate with ID % does not exist', _debate_id;
  END IF;

  -- Build nodes
  nodes := ARRAY[
    ROW('Pre: For')::sankey_node,
    ROW('Pre: Against')::sankey_node,
    ROW('Pre: Undecided')::sankey_node,
    ROW('Post: For')::sankey_node,
    ROW('Post: Against')::sankey_node,
    ROW('Post: Undecided')::sankey_node
  ];

  -- Build links
  SELECT ARRAY_AGG(ROW(source, target, value)::sankey_link)
  INTO links
  FROM (
    SELECT
      CASE
        WHEN v.pre_vote->>'option' = 'for' THEN 0
        WHEN v.pre_vote->>'option' = 'against' THEN 1
        ELSE 2
      END AS source,
      CASE
        WHEN v.post_vote->>'option' = 'for' THEN 3
        WHEN v.post_vote->>'option' = 'against' THEN 4
        ELSE 5
      END AS target,
      COUNT(*) AS value
    FROM votes v
    WHERE v.debate_id = _debate_id
      AND v.pre_vote IS NOT NULL
      AND v.post_vote IS NOT NULL
    GROUP BY source, target
  ) t;

  -- Build result
  result := ROW(nodes, links, debate_phase);

  RETURN result;
END;$function$
;

CREATE OR REPLACE FUNCTION public.get_debate_vote_counts(debate_id uuid)
 RETURNS debate_vote_counts
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$DECLARE
  debate_exists BOOLEAN;
  pre_counts phase_counts;
  post_counts phase_counts;
  total_voters integer;
  debate_phase "Debate Phase";
  result debate_vote_counts;
  _debate_id UUID := debate_id;
BEGIN
  -- Check if debate exists and get current phase
  SELECT EXISTS(
    SELECT 1 FROM debates WHERE id = _debate_id
  ), 
  (SELECT current_phase FROM debates WHERE id = _debate_id)
  INTO debate_exists, debate_phase;
  
  IF NOT debate_exists THEN
    RAISE EXCEPTION 'Debate with ID % does not exist', _debate_id;
  END IF;

  -- Pre-vote counts
  SELECT
    COUNT(v.pre_vote) FILTER (WHERE v.pre_vote->>'option' = 'for'),
    COUNT(v.pre_vote) FILTER (WHERE v.pre_vote->>'option' = 'against'),
    COUNT(v.pre_vote) FILTER (WHERE v.pre_vote->>'option' = 'undecided')
  INTO pre_counts
  FROM votes v
  WHERE v.debate_id = _debate_id;

  -- Post-vote counts
  SELECT
    COUNT(v.post_vote) FILTER (WHERE v.post_vote->>'option' = 'for'),
    COUNT(v.post_vote) FILTER (WHERE v.post_vote->>'option' = 'against'),
    COUNT(v.post_vote) FILTER (WHERE v.post_vote->>'option' = 'undecided')
  INTO post_counts
  FROM votes v
  WHERE v.debate_id = _debate_id;

  -- Total voters
  SELECT COUNT(DISTINCT v.user_id)
  INTO total_voters
  FROM votes v
  WHERE v.debate_id = _debate_id;

  -- Build result
  result := ROW(pre_counts, post_counts, total_voters, debate_phase);

  RETURN result;
END;$function$
;

-- Function to get debate result data in the required shape
CREATE OR REPLACE FUNCTION public.get_debate_result_data(debate_id uuid)
 RETURNS debate_result
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  debate_exists BOOLEAN;
  before_counts debate_result_before_after;
  after_counts debate_result_before_after;
  flows debate_result_flows;
  result debate_result;
  _debate_id UUID := debate_id;
BEGIN
  -- Check if debate exists
  SELECT EXISTS(
    SELECT 1 FROM debates WHERE id = _debate_id
  ) INTO debate_exists;
  IF NOT debate_exists THEN
    RAISE EXCEPTION 'Debate with ID % does not exist', _debate_id;
  END IF;

  -- Before counts
  SELECT
    COUNT(*) FILTER (WHERE v.pre_vote->>'option' = 'for'),
    COUNT(*) FILTER (WHERE v.pre_vote->>'option' = 'against'),
    COUNT(*) FILTER (WHERE v.pre_vote->>'option' = 'undecided')
  INTO before_counts
  FROM votes v
  WHERE v.debate_id = _debate_id;

  -- After counts
  SELECT
    COUNT(*) FILTER (WHERE v.post_vote->>'option' = 'for'),
    COUNT(*) FILTER (WHERE v.post_vote->>'option' = 'against'),
    COUNT(*) FILTER (WHERE v.post_vote->>'option' = 'undecided')
  INTO after_counts
  FROM votes v
  WHERE v.debate_id = _debate_id;

  -- Flows
  SELECT
    COUNT(*) FILTER (WHERE v.pre_vote->>'option' = 'for' AND v.post_vote->>'option' = 'for'),
    COUNT(*) FILTER (WHERE v.pre_vote->>'option' = 'for' AND v.post_vote->>'option' = 'against'),
    COUNT(*) FILTER (WHERE v.pre_vote->>'option' = 'for' AND v.post_vote->>'option' = 'undecided'),
    COUNT(*) FILTER (WHERE v.pre_vote->>'option' = 'against' AND v.post_vote->>'option' = 'for'),
    COUNT(*) FILTER (WHERE v.pre_vote->>'option' = 'against' AND v.post_vote->>'option' = 'against'),
    COUNT(*) FILTER (WHERE v.pre_vote->>'option' = 'against' AND v.post_vote->>'option' = 'undecided'),
    COUNT(*) FILTER (WHERE v.pre_vote->>'option' = 'undecided' AND v.post_vote->>'option' = 'for'),
    COUNT(*) FILTER (WHERE v.pre_vote->>'option' = 'undecided' AND v.post_vote->>'option' = 'against'),
    COUNT(*) FILTER (WHERE v.pre_vote->>'option' = 'undecided' AND v.post_vote->>'option' = 'undecided')
  INTO flows
  FROM votes v
  WHERE v.debate_id = _debate_id
    AND v.pre_vote IS NOT NULL
    AND v.post_vote IS NOT NULL;

  -- Assemble result
  result := ROW(before_counts, after_counts, flows);
  RETURN result;
END;
$function$;


