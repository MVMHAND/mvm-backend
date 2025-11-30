-- ================================================
-- USER INVITATIONS TABLE
-- ================================================
-- This table stores pending user invitations before they are converted to actual auth users

CREATE TABLE user_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX idx_user_invitations_email ON user_invitations(email);
CREATE INDEX idx_user_invitations_token_hash ON user_invitations(token_hash);
CREATE INDEX idx_user_invitations_expires_at ON user_invitations(expires_at);

-- Update trigger
CREATE TRIGGER update_user_invitations_updated_at
    BEFORE UPDATE ON user_invitations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read invitations"
    ON user_invitations FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow service role to manage invitations"
    ON user_invitations FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Comment
COMMENT ON TABLE user_invitations IS 'Pending user invitations before auth account creation';
COMMENT ON COLUMN user_invitations.token_hash IS 'Hashed invitation token for security';
COMMENT ON COLUMN user_invitations.expires_at IS 'Expiration time for invitation (typically 24-48 hours)';
COMMENT ON COLUMN user_invitations.accepted_at IS 'When the invitation was accepted and user was created';
