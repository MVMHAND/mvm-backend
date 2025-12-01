-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- ENUMS
-- ================================================

CREATE TYPE user_status AS ENUM ('invited', 'active', 'inactive', 'deleted');

-- ================================================
-- TABLES
-- ================================================

-- Roles table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add constraint to ensure only one super admin role exists
CREATE UNIQUE INDEX unique_super_admin ON roles (is_super_admin) WHERE is_super_admin = TRUE;

-- Profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    avatar_url TEXT,
    status user_status NOT NULL DEFAULT 'active',
    role_id UUID REFERENCES roles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- Permissions table
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    permission_key TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    description TEXT,
    "group" TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Role permissions junction table
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_key TEXT NOT NULL REFERENCES permissions(permission_key) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(role_id, permission_key)
);

-- Audit logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id UUID,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================
-- INDEXES
-- ================================================

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_status ON profiles(status);
CREATE INDEX idx_profiles_role_id ON profiles(role_id);
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_key ON role_permissions(permission_key);
CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action_type ON audit_logs(action_type);

-- ================================================
-- FUNCTIONS
-- ================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to prevent super admin role modification
CREATE OR REPLACE FUNCTION prevent_super_admin_modification()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.is_super_admin = TRUE THEN
        RAISE EXCEPTION 'Cannot modify or delete Super Admin role';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to prevent super admin user modification
CREATE OR REPLACE FUNCTION prevent_super_admin_user_modification()
RETURNS TRIGGER AS $$
DECLARE
    super_admin_role_id UUID;
BEGIN
    SELECT id INTO super_admin_role_id FROM roles WHERE is_super_admin = TRUE LIMIT 1;
    
    IF OLD.role_id = super_admin_role_id THEN
        IF TG_OP = 'DELETE' OR NEW.role_id != OLD.role_id OR NEW.status != OLD.status THEN
            RAISE EXCEPTION 'Cannot modify or delete Super Admin user';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- TRIGGERS
-- ================================================

-- Update updated_at on roles
CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at on profiles
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Prevent super admin role modification
CREATE TRIGGER prevent_super_admin_role_update
    BEFORE UPDATE OR DELETE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION prevent_super_admin_modification();

-- Prevent super admin user modification
CREATE TRIGGER prevent_super_admin_profile_update
    BEFORE UPDATE OR DELETE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION prevent_super_admin_user_modification();

-- ================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================

-- Enable RLS on all tables
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for roles
CREATE POLICY "Allow authenticated users to read roles"
    ON roles FOR SELECT
    TO authenticated
    USING (true);

-- RLS Policies for profiles
CREATE POLICY "Allow authenticated users to read profiles"
    ON profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow service role to insert profiles"
    ON profiles FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow users to update own profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow service role to delete profiles"
    ON profiles FOR DELETE
    TO authenticated
    USING (true);

-- RLS Policies for permissions
CREATE POLICY "Allow authenticated users to read permissions"
    ON permissions FOR SELECT
    TO authenticated
    USING (true);

-- RLS Policies for role_permissions
CREATE POLICY "Allow authenticated users to read role_permissions"
    ON role_permissions FOR SELECT
    TO authenticated
    USING (true);

-- RLS Policies for audit_logs
CREATE POLICY "Allow authenticated users to read audit_logs"
    ON audit_logs FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow service role to insert audit_logs"
    ON audit_logs FOR INSERT
    TO service_role
    WITH CHECK (true);

-- ================================================
-- SEED DATA
-- ================================================

-- Insert Super Admin role
INSERT INTO roles (name, description, is_super_admin, is_system)
VALUES ('Super Admin', 'System super administrator with full access', TRUE, TRUE);

-- Insert default roles
INSERT INTO roles (name, description, is_system)
VALUES 
    ('Admin', 'Administrator with most permissions', TRUE),
    ('Manager', 'Manager with limited administrative permissions', TRUE),
    ('Support', 'Support staff with read-only access', TRUE);

-- Insert initial permissions
-- These are synced with src/config/menu.ts via subsequent migrations
INSERT INTO permissions (permission_key, label, description, "group")
VALUES
    -- User permissions
    ('users.view', 'View Users', 'View user list and details', 'Users'),
    ('users.create', 'Create Users', 'Invite and create new users', 'Users'),
    ('users.edit', 'Edit Users', 'Edit user information', 'Users'),
    ('users.delete', 'Delete Users', 'Delete or deactivate users', 'Users'),
    
    -- Role permissions
    ('roles.view', 'View Roles', 'View roles and permissions', 'Roles'),
    ('roles.create', 'Create Roles', 'Create new roles', 'Roles'),
    ('roles.edit', 'Edit Roles', 'Edit role information and permissions', 'Roles'),
    ('roles.delete', 'Delete Roles', 'Delete roles', 'Roles'),
    
    -- Audit log permissions
    ('audit.view', 'View Audit Logs', 'View system audit logs', 'Audit'),
    
    -- Settings permissions
    ('settings.view', 'View Settings', 'View system settings', 'Settings'),
    ('settings.edit', 'Edit Settings', 'Modify system settings', 'Settings');

-- Assign all permissions to Admin role (not Super Admin, as it bypasses checks)
INSERT INTO role_permissions (role_id, permission_key)
SELECT r.id, p.permission_key
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Admin';

-- Assign limited permissions to Manager role
INSERT INTO role_permissions (role_id, permission_key)
SELECT r.id, p.permission_key
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Manager'
AND p.permission_key IN (
    'users.view', 'users.create', 'users.edit',
    'roles.view',
    'audit.view'
);

-- Assign read-only permissions to Support role
INSERT INTO role_permissions (role_id, permission_key)
SELECT r.id, p.permission_key
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Support'
AND p.permission_key IN (
    'users.view',
    'roles.view'
);

-- ================================================
-- COMMENTS
-- ================================================

COMMENT ON TABLE roles IS 'User roles for RBAC';
COMMENT ON TABLE profiles IS 'User profiles linked to auth.users';
COMMENT ON TABLE permissions IS 'System permissions';
COMMENT ON TABLE role_permissions IS 'Junction table for role-permission relationships';
COMMENT ON TABLE audit_logs IS 'Audit trail for all system actions';

COMMENT ON COLUMN roles.is_super_admin IS 'Marks the single super admin role';
COMMENT ON COLUMN roles.is_system IS 'Marks system roles that should not be deleted';
COMMENT ON COLUMN profiles.status IS 'User account status';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional context for the logged action';

-- ================================================
-- STORAGE BUCKET & POLICIES FOR AVATARS
-- ================================================

-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload avatars
CREATE POLICY "Authenticated users can upload avatars"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'avatars');

-- Allow authenticated users to update avatars
CREATE POLICY "Authenticated users can update avatars"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'avatars');

-- Allow authenticated users to delete avatars
CREATE POLICY "Authenticated users can delete avatars"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'avatars');

-- Allow public read access to avatars (bucket is public)
CREATE POLICY "Public read access to avatars"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'avatars');
