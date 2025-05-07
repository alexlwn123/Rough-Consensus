-- Create table to track which users have access to which debates
CREATE TABLE IF NOT EXISTS public.debate_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  debate_id UUID NOT NULL REFERENCES public.debates(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, debate_id)
);

-- Add RLS policies to debate_access table
ALTER TABLE public.debate_access ENABLE ROW LEVEL SECURITY;

-- Users can only see their own access records
CREATE POLICY "Users can view their own debate access"
  ON public.debate_access
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own access records (when they use an invite code)
CREATE POLICY "Users can insert their own debate access"
  ON public.debate_access
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for the debates table
ALTER TABLE public.debates ENABLE ROW LEVEL SECURITY;

-- Users can view debates that are:
-- 1. In the "finished" state (public to all), OR
-- 2. They have an entry in the debate_access table, OR
-- 3. They have admin rights (via user_roles table)
CREATE POLICY "Control debate visibility"
  ON public.debates
  FOR SELECT
  USING (
    current_phase = 'finished'::public."Debate Phase"
    OR EXISTS (
      SELECT 1 FROM public.debate_access
      WHERE debate_access.debate_id = debates.id AND debate_access.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );
-- Add functions to manage debate access

-- Function to register debate access when a user uses an invite code
CREATE OR REPLACE FUNCTION public.register_debate_access(debate_id_param UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only proceed if authenticated
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  -- Insert access record if it doesn't exist
  INSERT INTO public.debate_access (user_id, debate_id)
  VALUES (auth.uid(), debate_id_param)
  ON CONFLICT (user_id, debate_id) DO NOTHING;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;