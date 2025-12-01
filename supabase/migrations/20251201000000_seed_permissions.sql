-- Migration: Sync Permissions with Menu Config
-- Description: Removes stale permissions and ensures all permissions from src/config/menu.ts exist
-- This replaces the old sync-permissions.ts runtime script with a proper migration

-- ================================================
-- DELETE STALE PERMISSIONS
-- ================================================
-- Settings permissions were removed from menu config
-- role_permissions will cascade delete automatically

DELETE FROM public.permissions 
WHERE permission_key IN ('settings.view', 'settings.edit');

-- ================================================
-- UPSERT CURRENT PERMISSIONS
-- ================================================
-- Ensure all permissions from menu config exist with correct metadata

-- Users permissions
INSERT INTO public.permissions (permission_key, label, description, "group")
VALUES
  ('users.view', 'View Users', 'View user list and details', 'Users'),
  ('users.create', 'Create Users', 'Invite and create new users', 'Users'),
  ('users.edit', 'Edit Users', 'Edit user information', 'Users'),
  ('users.delete', 'Delete Users', 'Delete or deactivate users', 'Users')
ON CONFLICT (permission_key) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  "group" = EXCLUDED."group";

-- Roles permissions
INSERT INTO public.permissions (permission_key, label, description, "group")
VALUES
  ('roles.view', 'View Roles', 'View roles and permissions', 'Roles'),
  ('roles.create', 'Create Roles', 'Create new roles', 'Roles'),
  ('roles.edit', 'Edit Roles', 'Edit role information and permissions', 'Roles'),
  ('roles.delete', 'Delete Roles', 'Delete roles', 'Roles')
ON CONFLICT (permission_key) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  "group" = EXCLUDED."group";

-- Blog permissions
INSERT INTO public.permissions (permission_key, label, description, "group")
VALUES
  ('blog.view', 'View Blog', 'View blog posts, categories, and contributors', 'Blog'),
  ('blog.manage', 'Manage Blog', 'Full blog management (create, edit, delete, publish)', 'Blog')
ON CONFLICT (permission_key) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  "group" = EXCLUDED."group";

-- Audit permissions
INSERT INTO public.permissions (permission_key, label, description, "group")
VALUES
  ('audit.view', 'View Audit Logs', 'View system audit logs (Super Admin only)', 'Audit')
ON CONFLICT (permission_key) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  "group" = EXCLUDED."group";
