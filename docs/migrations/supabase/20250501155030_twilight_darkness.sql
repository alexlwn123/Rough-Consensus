/*
  # Initial Schema Setup for Debate Voting Platform

  1. New Tables
    - `debates`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `current_phase` (text)
      - `start_time` (timestamptz)
      - `end_time` (timestamptz, nullable)
      - `created_by` (uuid, references auth.users)
      - `created_at` (timestamptz)
      
    - `votes`
      - `id` (uuid, primary key)
      - `debate_id` (uuid, references debates)
      - `user_id` (uuid, references auth.users)
      - `pre_vote` (jsonb)
      - `post_vote` (jsonb)
      - `created_at` (timestamptz)
      - Unique constraint on debate_id and user_id

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create debates table
CREATE TABLE IF NOT EXISTS debates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  current_phase text NOT NULL DEFAULT 'pre',
  start_time timestamptz NOT NULL DEFAULT now(),
  end_time timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  debate_id uuid REFERENCES debates(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  pre_vote jsonb,
  post_vote jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(debate_id, user_id)
);

-- Enable RLS
ALTER TABLE debates ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Debate policies
CREATE POLICY "Debates are viewable by everyone"
  ON debates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Debates can be created by authenticated users"
  ON debates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Debates can be updated by creators"
  ON debates FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

-- Vote policies
CREATE POLICY "Votes are viewable by everyone"
  ON votes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own votes"
  ON votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes"
  ON votes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);