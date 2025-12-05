-- ================================================
-- FUNCTIONS AND TRIGGERS
-- ================================================
-- Reusable functions and triggers for all tables

-- ================================================
-- FUNCTION: Update updated_at timestamp
-- ================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- FUNCTION: Prevent super admin role modification
-- ================================================
CREATE OR REPLACE FUNCTION prevent_super_admin_modification()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.is_super_admin = TRUE THEN
        RAISE EXCEPTION 'Cannot modify or delete Super Admin role';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- FUNCTION: Prevent super admin user modification
-- ================================================
CREATE OR REPLACE FUNCTION prevent_super_admin_user_modification()
RETURNS TRIGGER AS $$
DECLARE
    super_admin_role_id UUID;
BEGIN
    SELECT id INTO super_admin_role_id FROM user_roles WHERE is_super_admin = TRUE LIMIT 1;
    
    IF OLD.role_id = super_admin_role_id THEN
        IF TG_OP = 'DELETE' OR NEW.role_id != OLD.role_id OR NEW.status != OLD.status THEN
            RAISE EXCEPTION 'Cannot modify or delete Super Admin user';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- TRIGGERS: updated_at for user tables
-- ================================================
CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_invitations_updated_at
    BEFORE UPDATE ON user_invitations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- TRIGGERS: updated_at for blog tables
-- ================================================
CREATE TRIGGER update_blog_categories_updated_at
    BEFORE UPDATE ON blog_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_contributors_updated_at
    BEFORE UPDATE ON blog_contributors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at
    BEFORE UPDATE ON blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- TRIGGERS: Super admin protection
-- ================================================
CREATE TRIGGER prevent_super_admin_user_role_update
    BEFORE UPDATE OR DELETE ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION prevent_super_admin_modification();

CREATE TRIGGER prevent_super_admin_user_update
    BEFORE UPDATE OR DELETE ON users
    FOR EACH ROW
    EXECUTE FUNCTION prevent_super_admin_user_modification();
