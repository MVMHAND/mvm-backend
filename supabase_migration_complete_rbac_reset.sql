-- Migration: Complete RBAC Reset - Three System Roles Only
-- This migration completely resets the RBAC system with only Super Admin, Admin, and Manager roles
-- WARNING: This will affect existing users. Make sure to backup data before running.

BEGIN;

-- ============================================================================
-- STEP 1: Clear all existing role-permission mappings
-- ============================================================================
DELETE FROM user_role_permissions;

-- ============================================================================
-- STEP 2: Clear all existing permissions
-- ============================================================================
DELETE FROM user_permissions;

-- ============================================================================
-- STEP 3: Store current Super Admin user (to preserve)
-- ============================================================================
DO $$
DECLARE
  v_current_super_admin_user_id UUID;
  v_current_super_admin_role_id UUID;
BEGIN
  -- Find current super admin role
  SELECT id INTO v_current_super_admin_role_id 
  FROM user_roles 
  WHERE is_super_admin = TRUE 
  LIMIT 1;

  -- Find current super admin user
  IF v_current_super_admin_role_id IS NOT NULL THEN
    SELECT id INTO v_current_super_admin_user_id 
    FROM users 
    WHERE role_id = v_current_super_admin_role_id 
    LIMIT 1;

    -- Store in a temporary table for later restoration
    CREATE TEMP TABLE temp_super_admin_user AS
    SELECT * FROM users WHERE id = v_current_super_admin_user_id;
  END IF;
END $$;

-- ============================================================================
-- STEP 4: Delete all existing roles
-- ============================================================================
-- First, we need to handle users table foreign key constraint
-- Option 1: Set all users' role_id to NULL temporarily
UPDATE users SET role_id = NULL;

-- Now we can safely delete all roles
DELETE FROM user_roles;

-- ============================================================================
-- STEP 5: Create three fresh system roles
-- ============================================================================

-- Create Super Admin role
INSERT INTO user_roles (id, name, description, is_super_admin, is_system, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Super Admin',
  'Has complete access to all system features and settings. Only one Super Admin can exist.',
  TRUE,
  TRUE,
  NOW(),
  NOW()
);

-- Create Admin role
INSERT INTO user_roles (id, name, description, is_super_admin, is_system, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Admin',
  'Has full administrative access with all permissions assigned.',
  FALSE,
  TRUE,
  NOW(),
  NOW()
);

-- Create Manager role
INSERT INTO user_roles (id, name, description, is_super_admin, is_system, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Manager',
  'Can manage users and blog content with limited permissions.',
  FALSE,
  FALSE,
  NOW(),
  NOW()
);

-- ============================================================================
-- STEP 6: Insert all permission definitions
-- ============================================================================
INSERT INTO user_permissions (permission_key, display_name, description, category, created_at, updated_at)
VALUES
  -- User Management Permissions
  ('users.view', 'View Users', 'View user list and details', 'users', NOW(), NOW()),
  ('users.create', 'Create Users', 'Invite and create new users', 'users', NOW(), NOW()),
  ('users.edit', 'Edit Users', 'Edit user profiles and settings', 'users', NOW(), NOW()),
  ('users.delete', 'Delete Users', 'Delete users from the system', 'users', NOW(), NOW()),

  -- Role Management Permissions
  ('roles.view', 'View Roles', 'View roles and permissions', 'roles', NOW(), NOW()),
  ('roles.edit', 'Manage Roles', 'Create, edit, and delete roles and their permissions', 'roles', NOW(), NOW()),

  -- Blog Permissions (Granular)
  ('blog.view', 'View Blog', 'View blog posts, categories, and contributors', 'blog', NOW(), NOW()),
  ('blog.edit', 'Create & Edit Blog Posts', 'Create and edit existing blog posts', 'blog', NOW(), NOW()),
  ('blog.delete', 'Delete Blog Posts', 'Delete blog posts', 'blog', NOW(), NOW()),
  ('blog.publish', 'Publish Blog Posts', 'Publish and unpublish blog posts', 'blog', NOW(), NOW()),
  ('blog.categories.manage', 'Manage Blog Categories', 'Create, edit, and delete blog categories', 'blog', NOW(), NOW()),
  ('blog.contributors.manage', 'Manage Blog Contributors', 'Create, edit, and delete blog contributors', 'blog', NOW(), NOW()),

  -- Audit Permissions
  ('audit.view', 'View Audit Logs', 'View system audit logs', 'audit', NOW(), NOW()),

  -- Settings Permissions
  ('settings.manage', 'Manage Settings', 'Manage system settings', 'settings', NOW(), NOW());

-- ============================================================================
-- STEP 7: Assign permissions to roles
-- ============================================================================
DO $$
DECLARE
  v_super_admin_id UUID;
  v_admin_id UUID;
  v_manager_id UUID;
BEGIN
  -- Get the newly created role IDs
  SELECT id INTO v_super_admin_id FROM user_roles WHERE is_super_admin = TRUE LIMIT 1;
  SELECT id INTO v_admin_id FROM user_roles WHERE name = 'Admin' AND is_system = TRUE LIMIT 1;
  SELECT id INTO v_manager_id FROM user_roles WHERE name = 'Manager' AND is_system = FALSE LIMIT 1;

  -- Assign ALL permissions to Admin role
  INSERT INTO user_role_permissions (role_id, permission_id, created_at, updated_at)
  SELECT 
    v_admin_id,
    id,
    NOW(),
    NOW()
  FROM user_permissions;

  -- Assign specific permissions to Manager role
  INSERT INTO user_role_permissions (role_id, permission_id, created_at, updated_at)
  SELECT 
    v_manager_id,
    id,
    NOW(),
    NOW()
  FROM user_permissions
  WHERE permission_key IN (
    'users.view',
    'users.create',
    'users.edit',
    'blog.view',
    'blog.edit',
    'blog.publish',
    'blog.categories.manage'
  );

  -- Note: Super Admin doesn't need explicit permissions as isSuperAdmin() bypasses all checks

END $$;

-- ============================================================================
-- STEP 8: Restore Super Admin user with new role ID
-- ============================================================================
DO $$
DECLARE
  v_new_super_admin_role_id UUID;
  v_temp_super_admin_exists BOOLEAN;
BEGIN
  -- Check if we have a super admin user to restore
  SELECT EXISTS(SELECT 1 FROM temp_super_admin_user) INTO v_temp_super_admin_exists;

  IF v_temp_super_admin_exists THEN
    -- Get new Super Admin role ID
    SELECT id INTO v_new_super_admin_role_id 
    FROM user_roles 
    WHERE is_super_admin = TRUE 
    LIMIT 1;

    -- Restore the super admin user with new role_id
    UPDATE users 
    SET role_id = v_new_super_admin_role_id
    WHERE id IN (SELECT id FROM temp_super_admin_user);

    RAISE NOTICE 'Super Admin user restored with new role ID';
  ELSE
    RAISE NOTICE 'No existing Super Admin user found to restore';
  END IF;

  -- Clean up temp table
  DROP TABLE IF EXISTS temp_super_admin_user;
END $$;

-- ============================================================================
-- STEP 9: Handle other existing users (assign them to Admin role by default)
-- ============================================================================
-- This assigns any remaining users (with NULL role_id) to Admin role
-- You can modify this logic based on your needs
DO $$
DECLARE
  v_admin_role_id UUID;
BEGIN
  SELECT id INTO v_admin_role_id FROM user_roles WHERE name = 'Admin' AND is_system = TRUE LIMIT 1;

  -- Assign all users without a role to Admin role
  UPDATE users 
  SET role_id = v_admin_role_id
  WHERE role_id IS NULL;

  RAISE NOTICE 'All remaining users assigned to Admin role';
END $$;

COMMIT;

-- ============================================================================
-- Verification Queries (run these after migration to verify)
-- ============================================================================

-- View all roles
-- SELECT id, name, is_super_admin, is_system, description FROM user_roles ORDER BY is_super_admin DESC, name;

-- View all permissions
-- SELECT permission_key, display_name, category FROM user_permissions ORDER BY category, permission_key;

-- View role-permission mappings
-- SELECT 
--   ur.name as role_name,
--   ur.is_system,
--   up.permission_key,
--   up.display_name
-- FROM user_role_permissions urp
-- JOIN user_roles ur ON ur.id = urp.role_id
-- JOIN user_permissions up ON up.id = urp.permission_id
-- ORDER BY ur.name, up.category, up.permission_key;

-- View user role assignments
-- SELECT u.email, ur.name as role_name FROM users u JOIN user_roles ur ON u.role_id = ur.id;
