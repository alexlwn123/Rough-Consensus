/*
  # Add User Roles Table for Admin Functionality
  
  1. New Table
    - `user_roles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `role` (text)
      - `created_at` (timestamptz)
*/

-- Create user_roles table for admin functionality
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create a function to check admin status without recursion
CREATE OR REPLACE FUNCTION check_if_user_is_admin(user_uuid uuid)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM user_roles
        WHERE user_id = user_uuid
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create simplified policies that don't cause recursion
CREATE POLICY "Users can view their own roles"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON user_roles
  USING (check_if_user_is_admin(auth.uid()));

-- Allow admins to update any debate regardless of creator
CREATE POLICY "Admins can update any debate"
  ON debates FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = created_by OR
    check_if_user_is_admin(auth.uid())
  );
