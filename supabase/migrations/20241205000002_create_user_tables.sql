-- ================================================
-- USER MANAGEMENT TABLES
-- ================================================
-- Tables for RBAC: roles, profiles, permissions, audit logs, invitations

-- ================================================
-- ROLES TABLE
-- ================================================
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure only one super admin role exists
CREATE UNIQUE INDEX idx_user_roles_unique_super_admin ON user_roles (is_super_admin) WHERE is_super_admin = TRUE;

COMMENT ON TABLE user_roles IS 'User roles for RBAC';
COMMENT ON COLUMN user_roles.is_super_admin IS 'Marks the single super admin role';
COMMENT ON COLUMN user_roles.is_system IS 'Marks system roles that should not be deleted';

-- ================================================
-- USERS TABLE
-- ================================================
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    avatar_url TEXT,
    status user_status NOT NULL DEFAULT 'active',
    role_id UUID NOT NULL REFERENCES user_roles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_role_id ON users(role_id);

COMMENT ON TABLE users IS 'User profiles linked to auth.users';
COMMENT ON COLUMN users.status IS 'User account status';

-- ================================================
-- PERMISSIONS TABLE
-- ================================================
CREATE TABLE user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    permission_key TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    description TEXT,
    "group" TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE user_permissions IS 'System permissions';

-- ================================================
-- ROLE PERMISSIONS JUNCTION TABLE
-- ================================================
CREATE TABLE user_role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES user_roles(id) ON DELETE CASCADE,
    permission_key TEXT NOT NULL REFERENCES user_permissions(permission_key) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(role_id, permission_key)
);

CREATE INDEX idx_user_role_permissions_role_id ON user_role_permissions(role_id);
CREATE INDEX idx_user_role_permissions_permission_key ON user_role_permissions(permission_key);

COMMENT ON TABLE user_role_permissions IS 'Junction table for role-permission relationships';

-- ================================================
-- AUDIT LOGS TABLE
-- ================================================
CREATE TABLE user_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id UUID,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_audit_logs_actor_id ON user_audit_logs(actor_id);
CREATE INDEX idx_user_audit_logs_created_at ON user_audit_logs(created_at DESC);
CREATE INDEX idx_user_audit_logs_action_type ON user_audit_logs(action_type);

COMMENT ON TABLE user_audit_logs IS 'Audit trail for all system actions';
COMMENT ON COLUMN user_audit_logs.metadata IS 'Additional context for the logged action';

-- ================================================
-- USER INVITATIONS TABLE
-- ================================================
CREATE TABLE user_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    role_id UUID NOT NULL REFERENCES user_roles(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_invitations_email ON user_invitations(email);
CREATE INDEX idx_user_invitations_token_hash ON user_invitations(token_hash);
CREATE INDEX idx_user_invitations_expires_at ON user_invitations(expires_at);

COMMENT ON TABLE user_invitations IS 'User invitation tokens with 7-day expiry';

-- ================================================
-- PASSWORD RESET TOKENS TABLE
-- ================================================
CREATE TABLE user_password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_password_reset_tokens_user_id ON user_password_reset_tokens(user_id);
CREATE INDEX idx_user_password_reset_tokens_token_hash ON user_password_reset_tokens(token_hash);
CREATE INDEX idx_user_password_reset_tokens_expires_at ON user_password_reset_tokens(expires_at);

COMMENT ON TABLE user_password_reset_tokens IS 'Password reset tokens with 30-minute expiry';
