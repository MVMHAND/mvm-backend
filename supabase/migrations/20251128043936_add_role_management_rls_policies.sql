-- ================================================
-- ADD RLS POLICIES FOR ROLE MANAGEMENT
-- ================================================
-- These policies allow authenticated users to manage roles
-- (Super Admin restrictions are handled at application level)

-- Allow authenticated users to insert roles
CREATE POLICY "Allow authenticated users to insert roles"
    ON roles FOR INSERT
    TO authenticated
    WITH CHECK (
        -- Cannot create super admin roles
        is_super_admin = FALSE
    );

-- Allow authenticated users to update roles
CREATE POLICY "Allow authenticated users to update roles"
    ON roles FOR UPDATE
    TO authenticated
    USING (
        -- Cannot update super admin role
        is_super_admin = FALSE
    )
    WITH CHECK (
        -- Cannot make a role super admin
        is_super_admin = FALSE
    );

-- Allow authenticated users to delete roles
CREATE POLICY "Allow authenticated users to delete roles"
    ON roles FOR DELETE
    TO authenticated
    USING (
        -- Cannot delete super admin or system roles
        is_super_admin = FALSE AND is_system = FALSE
    );

-- Allow authenticated users to manage role_permissions
CREATE POLICY "Allow authenticated users to insert role_permissions"
    ON role_permissions FOR INSERT
    TO authenticated
    WITH CHECK (TRUE);

CREATE POLICY "Allow authenticated users to delete role_permissions"
    ON role_permissions FOR DELETE
    TO authenticated
    USING (TRUE);

-- Allow authenticated users to insert audit_logs
CREATE POLICY "Allow authenticated users to insert audit_logs"
    ON audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (TRUE);
