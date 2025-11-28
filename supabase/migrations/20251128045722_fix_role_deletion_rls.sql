-- ================================================
-- FIX ROLE DELETION RLS POLICY
-- ================================================
-- Allow deletion of any role except Super Admin
-- System roles can also be deleted (user requirement)

-- Drop existing delete policy
DROP POLICY IF EXISTS "Allow authenticated users to delete roles" ON roles;

-- Create new delete policy - only protect Super Admin
CREATE POLICY "Allow authenticated users to delete roles"
    ON roles FOR DELETE
    TO authenticated
    USING (is_super_admin = FALSE);
