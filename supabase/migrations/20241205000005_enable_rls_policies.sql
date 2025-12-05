-- ================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================
-- Enable RLS and create policies for all tables

-- ================================================
-- ENABLE RLS ON ALL TABLES
-- ================================================
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_contributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- ================================================
-- RLS POLICIES: user_roles
-- ================================================
CREATE POLICY "Allow authenticated users to read roles"
    ON user_roles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow service role full access to roles"
    ON user_roles FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ================================================
-- RLS POLICIES: users
-- ================================================
CREATE POLICY "Allow authenticated users to read users"
    ON users FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow service role to insert users"
    ON users FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow users to update own profile"
    ON users FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow service role to delete users"
    ON users FOR DELETE
    TO authenticated
    USING (true);

-- ================================================
-- RLS POLICIES: user_permissions
-- ================================================
CREATE POLICY "Allow authenticated users to read permissions"
    ON user_permissions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow service role full access to permissions"
    ON user_permissions FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ================================================
-- RLS POLICIES: user_role_permissions
-- ================================================
CREATE POLICY "Allow authenticated users to read role_permissions"
    ON user_role_permissions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow service role full access to role_permissions"
    ON user_role_permissions FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ================================================
-- RLS POLICIES: user_audit_logs
-- ================================================
CREATE POLICY "Allow authenticated users to read audit_logs"
    ON user_audit_logs FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow service role to insert audit_logs"
    ON user_audit_logs FOR INSERT
    TO service_role
    WITH CHECK (true);

-- ================================================
-- RLS POLICIES: user_invitations
-- ================================================
CREATE POLICY "Allow authenticated users to read invitations"
    ON user_invitations FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow service role full access to invitations"
    ON user_invitations FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ================================================
-- RLS POLICIES: user_password_reset_tokens
-- ================================================
CREATE POLICY "Allow service role full access to password reset tokens"
    ON user_password_reset_tokens FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ================================================
-- RLS POLICIES: blog_categories
-- ================================================
CREATE POLICY "Allow authenticated users to read categories"
    ON blog_categories FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert categories"
    ON blog_categories FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update categories"
    ON blog_categories FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete categories"
    ON blog_categories FOR DELETE
    TO authenticated
    USING (true);

CREATE POLICY "Allow public to read categories"
    ON blog_categories FOR SELECT
    TO anon
    USING (true);

CREATE POLICY "Allow service role full access to categories"
    ON blog_categories FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ================================================
-- RLS POLICIES: blog_contributors
-- ================================================
CREATE POLICY "Allow authenticated users to read contributors"
    ON blog_contributors FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert contributors"
    ON blog_contributors FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update contributors"
    ON blog_contributors FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete contributors"
    ON blog_contributors FOR DELETE
    TO authenticated
    USING (true);

CREATE POLICY "Allow public to read contributors"
    ON blog_contributors FOR SELECT
    TO anon
    USING (true);

CREATE POLICY "Allow service role full access to contributors"
    ON blog_contributors FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ================================================
-- RLS POLICIES: blog_posts
-- ================================================
CREATE POLICY "Allow authenticated users to read all posts"
    ON blog_posts FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert posts"
    ON blog_posts FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update posts"
    ON blog_posts FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete posts"
    ON blog_posts FOR DELETE
    TO authenticated
    USING (true);

CREATE POLICY "Allow public to read published posts"
    ON blog_posts FOR SELECT
    TO anon
    USING (status = 'published' AND published_date IS NOT NULL);

CREATE POLICY "Allow service role full access to posts"
    ON blog_posts FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
