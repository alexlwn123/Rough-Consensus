/*
  # Server-side Vote Aggregation Functions
  
  This migration adds two functions that handle vote aggregation on the server rather than
  exposing individual votes to the client. This helps preserve user privacy by:
  
  1. Only returning aggregated counts
  2. Only exposing the necessary data for visualization
  3. Preventing client-side access to individual voting patterns

  Functions added:
  - get_debate_vote_counts(debate_id): Returns aggregated vote counts by phase and option
  - get_debate_sankey_data(debate_id): Returns sankey diagram data showing vote transitions
*/

-- Function to get aggregated vote counts for a debate
CREATE OR REPLACE FUNCTION get_debate_vote_counts(debate_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $a$
DECLARE
  debate_exists BOOLEAN;
  result JSONB;
  debate_phase "Debate Phase";
BEGIN
  -- Check if debate exists and get current phase
  SELECT EXISTS(
    SELECT 1 FROM debates WHERE id = debate_id
  ), 
  (SELECT current_phase FROM debates WHERE id = debate_id)
  INTO debate_exists, debate_phase;
  
  IF NOT debate_exists THEN
    RAISE EXCEPTION 'Debate with ID % does not exist', debate_id;
  END IF;

  -- Create JSON structure with counts
  SELECT jsonb_build_object(
    'pre', jsonb_build_object(
      'for', COUNT(v.pre_vote) FILTER (WHERE v.pre_vote->>'option' = 'for'),
      'against', COUNT(v.pre_vote) FILTER (WHERE v.pre_vote->>'option' = 'against'),
      'undecided', COUNT(v.pre_vote) FILTER (WHERE v.pre_vote->>'option' = 'undecided')
    ),
    'post', jsonb_build_object(
      'for', COUNT(v.post_vote) FILTER (WHERE v.post_vote->>'option' = 'for'),
      'against', COUNT(v.post_vote) FILTER (WHERE v.post_vote->>'option' = 'against'),
      'undecided', COUNT(v.post_vote) FILTER (WHERE v.post_vote->>'option' = 'undecided')
    ),
    'total_voters', COUNT(DISTINCT v.user_id),
    'current_phase', debate_phase
  ) INTO result
  FROM votes v
  WHERE v.debate_id = get_debate_vote_counts.debate_id;
  
  RETURN result;
END;
$a$;

-- Function to get sankey diagram data for a debate
CREATE OR REPLACE FUNCTION get_debate_sankey_data(debate_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $b$
DECLARE
  debate_exists BOOLEAN;
  debate_phase "Debate Phase";
  nodes JSONB;
  links JSONB;
  result JSONB;
BEGIN
  -- Check if debate exists and get phase
  SELECT EXISTS(
    SELECT 1 FROM debates WHERE id = debate_id
  ),
  (SELECT current_phase FROM debates WHERE id = debate_id)
  INTO debate_exists, debate_phase;
  
  IF NOT debate_exists THEN
    RAISE EXCEPTION 'Debate with ID % does not exist', debate_id;
  END IF;

  -- Create nodes array for Sankey diagram
  nodes := jsonb_build_array(
    jsonb_build_object('name', 'Pre: For'),
    jsonb_build_object('name', 'Pre: Against'),
    jsonb_build_object('name', 'Pre: Undecided'),
    jsonb_build_object('name', 'Post: For'),
    jsonb_build_object('name', 'Post: Against'),
    jsonb_build_object('name', 'Post: Undecided')
  );
  
  -- Create links array for Sankey diagram
  WITH transitions AS (
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
    WHERE v.debate_id = get_debate_sankey_data.debate_id
      AND v.pre_vote IS NOT NULL
      AND v.post_vote IS NOT NULL
    GROUP BY source, target
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'source', t.source,
      'target', t.target,
      'value', t.value
    )
  ) INTO links
  FROM transitions t;
  
  -- Handle empty links case
  IF links IS NULL THEN
    links := jsonb_build_array();
  END IF;
  
  -- Combine nodes and links into final result
  result := jsonb_build_object(
    'nodes', nodes,
    'links', links,
    'current_phase', debate_phase
  );
  
  RETURN result;
END;
$b$;

-- Create RPC access to these functions
GRANT EXECUTE ON FUNCTION get_debate_vote_counts(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_debate_sankey_data(UUID) TO authenticated;

-- Comment on functions
COMMENT ON FUNCTION get_debate_vote_counts(UUID) IS 'Returns aggregated vote counts for a debate by phase and option without exposing individual votes';
COMMENT ON FUNCTION get_debate_sankey_data(UUID) IS 'Returns Sankey diagram data showing vote transitions between pre and post debate phases without exposing individual votes';