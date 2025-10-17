-- Create a security definer function to check file permissions
CREATE OR REPLACE FUNCTION public.user_has_file_permission(file_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM file_permissions fp
    JOIN profiles p ON p.username = fp.username
    WHERE fp.shared_file_id = file_id
      AND p.id = auth.uid()
  );
$$;

-- Drop and recreate the problematic policy
DROP POLICY IF EXISTS "Users can view private files if permitted" ON shared_files;

CREATE POLICY "Users can view private files if permitted"
ON shared_files
FOR SELECT
USING (
  visibility = 'private'::file_visibility 
  AND public.user_has_file_permission(id)
);