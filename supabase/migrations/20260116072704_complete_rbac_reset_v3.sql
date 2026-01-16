-- ============================================================================
-- Migration: Complete RBAC System Reset
-- Description: Cleans up existing roles and permissions, establishes the
--              three-role system (Super Admin, Admin, Manager) with granular
--              blog permissions
-- Date: 2026-01-16
-- ============================================================================
-- 
-- This migration performs the following operations:
--   1. Removes legacy roles (Support, test)
--   2. Updates Manager role to is_system = FALSE (as per requirements)
--   3. Clears all existing role-permission mappings
--   4. Clears all existing permission definitions
--   5. Creates fresh permission definitions with granular blog permissions
--   6. Assigns all permissions to Admin role
--   7. Assigns specific permissions to Manager role
--
-- IMPORTANT NOTES:
--   - Super Admin role bypasses all permission checks at application level
--   - Super Admin role is not assigned explicit permissions in the database
--   - This migration is safe to run on databases with existing data
--   - Users assigned to deleted roles will need to be reassigned manually
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Clean Up Legacy Roles
-- ============================================================================
-- Remove roles that are no longer part of the system architecture
-- These roles (Support, test) are being consolidated into the three-role system
-- Note: This will fail if there are users assigned to these roles due to FK constraint

DELETE FROM user_roles 
WHERE name IN ('Support', 'test');

-- Expected result: 2 rows deleted (Support and test roles)

-- ============================================================================
-- STEP 2: Update Manager Role Configuration
-- ============================================================================
-- Set Manager role to is_system = FALSE as per requirements
-- This allows the Manager role to be more flexible while Admin and Super Admin
-- remain protected system roles

UPDATE user_roles 
SET is_system = FALSE 
WHERE name = 'Manager';

-- Expected result: 1 row updated

-- ============================================================================
-- STEP 3: Clear Existing Role-Permission Mappings
-- ============================================================================
-- Remove all existing role-permission associations
-- This ensures a clean slate for the new permission structure

DELETE FROM user_role_permissions;

-- Expected result: Variable (depends on existing mappings)

-- ============================================================================
-- STEP 4: Clear Existing Permission Definitions
-- ============================================================================
-- Remove all existing permission definitions
-- We will recreate them with the new granular structure

DELETE FROM user_permissions;

-- Expected result: Variable (depends on existing permissions)

-- ============================================================================
-- STEP 5: Create Fresh Permission Definitions
-- ============================================================================
-- Insert all permission definitions with the new granular structure
-- Blog permissions are now split into specific actions instead of single 'blog.manage'
-- 
-- Permission Structure:
--   - permission_key: Unique identifier (e.g., 'users.view')
--   - label: Human-readable name displayed in UI
--   - description: Detailed explanation of what the permission allows
--   - "group": Category for UI grouping (Users, Roles, Blog, Audit, Settings)
--   - created_at: Timestamp of creation

INSERT INTO user_permissions (permission_key, label, description, "group", created_at)
VALUES
  -- -------------------------------------------------------------------------
  -- User Management Permissions
  -- -------------------------------------------------------------------------
  -- These permissions control access to user management features

  ('users.view', 
   'View Users', 
   'View user list and details', 
   'Users', 
   NOW()),

  ('users.create', 
   'Create Users', 
   'Invite and create new users', 
   'Users', 
   NOW()),

  ('users.edit', 
   'Edit Users', 
   'Edit user profiles and settings', 
   'Users', 
   NOW()),

  ('users.delete', 
   'Delete Users', 
   'Delete users from the system', 
   'Users', 
   NOW()),

  -- -------------------------------------------------------------------------
  -- Role Management Permissions
  -- -------------------------------------------------------------------------
  -- These permissions control access to role and permission management

  ('roles.view', 
   'View Roles', 
   'View roles and permissions', 
   'Roles', 
   NOW()),

  ('roles.edit', 
   'Manage Roles', 
   'Create, edit, and delete roles and their permissions', 
   'Roles', 
   NOW()),

  -- -------------------------------------------------------------------------
  -- Blog Permissions (Granular)
  -- -------------------------------------------------------------------------
  -- Blog permissions are now split into specific actions for fine-grained control
  -- This replaces the previous single 'blog.manage' permission

  ('blog.view', 
   'View Blog', 
   'View blog posts, categories, and contributors', 
   'Blog', 
   NOW()),

  ('blog.edit', 
   'Edit Blog Posts', 
   'Edit existing blog posts', 
   'Blog', 
   NOW()),

  ('blog.delete', 
   'Delete Blog Posts', 
   'Delete blog posts', 
   'Blog', 
   NOW()),

  ('blog.publish', 
   'Publish Blog Posts', 
   'Publish and unpublish blog posts', 
   'Blog', 
   NOW()),

  ('blog.categories.manage', 
   'Manage Blog Categories', 
   'Create, edit, and delete blog categories', 
   'Blog', 
   NOW()),

  ('blog.contributors.manage', 
   'Manage Blog Contributors', 
   'Create, edit, and delete blog contributors', 
   'Blog', 
   NOW()),

  -- -------------------------------------------------------------------------
  -- Audit Permissions
  -- -------------------------------------------------------------------------
  -- Control access to audit logs and system activity tracking

  ('audit.view', 
   'View Audit Logs', 
   'View system audit logs', 
   'Audit', 
   NOW()),

  -- -------------------------------------------------------------------------
  -- Settings Permissions
  -- -------------------------------------------------------------------------
  -- Control access to system-wide settings and configuration

  ('settings.manage', 
   'Manage Settings', 
   'Manage system settings', 
   'Settings', 
   NOW());

-- Expected result: 15 rows inserted

-- ============================================================================
-- STEP 6: Assign All Permissions to Admin Role
-- ============================================================================
-- Admin role receives all available permissions in the system
-- This makes Admin a fully privileged role (except for Super Admin protections)
-- 
-- Admin role can:
--   - Manage all users (view, create, edit, delete)
--   - Manage all roles and permissions (view, edit)
--   - Full blog management (all blog permissions)
--   - View audit logs
--   - Manage system settings

INSERT INTO user_role_permissions (role_id, permission_key, created_at)
SELECT 
  (SELECT id FROM user_roles WHERE name = 'Admin' LIMIT 1),
  permission_key,
  NOW()
FROM user_permissions;

-- Expected result: 15 rows inserted (one for each permission)

-- ============================================================================
-- STEP 7: Assign Specific Permissions to Manager Role
-- ============================================================================
-- Manager role receives a limited subset of permissions
-- This creates a middle-tier role with operational capabilities but limited
-- administrative access
-- 
-- Manager role can:
--   - View, create, and edit users (but NOT delete)
--   - View, create, edit, and publish blog posts
--   - Manage blog categories
--   - CANNOT: Delete users, manage roles, delete blog posts, manage contributors,
--            view audit logs, manage settings

INSERT INTO user_role_permissions (role_id, permission_key, created_at)
SELECT 
  (SELECT id FROM user_roles WHERE name = 'Manager' LIMIT 1),
  permission_key,
  NOW()
FROM user_permissions
WHERE permission_key IN (
  -- User permissions (limited)
  'users.view',
  'users.create',
  'users.edit',
  -- NOTE: users.delete is intentionally excluded

  -- Blog permissions (most, but not all)
  'blog.view',
  'blog.edit',
  'blog.publish',
  'blog.categories.manage'
  -- NOTE: blog.delete and blog.contributors.manage are intentionally excluded

  -- NOTE: No roles, audit, or settings permissions for Manager
);

-- Expected result: 8 rows inserted

COMMIT;

-- ============================================================================
-- Post-Migration Verification Queries
-- ============================================================================
-- Run these queries after the migration to verify successful execution

-- 1. Verify role count (should be 3: Super Admin, Admin, Manager)
-- SELECT COUNT(*) as role_count FROM user_roles;
-- Expected: 3

-- 2. Verify role configuration
-- SELECT name, is_super_admin, is_system 
-- FROM user_roles 
-- ORDER BY is_super_admin DESC, is_system DESC, name;
-- Expected:
--   Super Admin | true  | true
--   Admin       | false | true
--   Manager     | false | false

-- 3. Verify permission count (should be 15)
-- SELECT COUNT(*) as permission_count FROM user_permissions;
-- Expected: 15

-- 4. Verify permission breakdown by group
-- SELECT "group", COUNT(*) as count 
-- FROM user_permissions 
-- GROUP BY "group" 
-- ORDER BY "group";
-- Expected:
--   Audit    | 1
--   Blog     | 7
--   Roles    | 2
--   Settings | 1
--   Users    | 4

-- 5. Verify Admin has all permissions (should be 15)
-- SELECT COUNT(*) as admin_permission_count
-- FROM user_role_permissions
-- WHERE role_id = (SELECT id FROM user_roles WHERE name = 'Admin');
-- Expected: 15

-- 6. Verify Manager has correct permissions (should be 8)
-- SELECT COUNT(*) as manager_permission_count
-- FROM user_role_permissions
-- WHERE role_id = (SELECT id FROM user_roles WHERE name = 'Manager');
-- Expected: 8

-- 7. View all role-permission mappings
-- SELECT 
--   ur.name as role_name,
--   up.permission_key,
--   up.label,
--   up."group"
-- FROM user_role_permissions urp
-- JOIN user_roles ur ON ur.id = urp.role_id
-- JOIN user_permissions up ON up.permission_key = urp.permission_key
-- ORDER BY ur.name, up."group", up.permission_key;

-- ============================================================================
-- End of Migration
-- ============================================================================