-- Migration: Blog Permissions
-- Description: Adds blog-related permissions and assigns them to appropriate roles

-- Insert blog permissions into the permissions table
INSERT INTO public.permissions (permission_key, label, description, "group")
VALUES
  ('blog.view', 'View Blog', 'View blog posts, categories, and contributors', 'Blog'),
  ('blog.manage', 'Manage Blog', 'Full blog management (create, edit, delete, publish)', 'Blog')
ON CONFLICT (permission_key) DO NOTHING;

-- Grant blog permissions to Super Admin role (has all permissions)
INSERT INTO public.role_permissions (role_id, permission_key)
SELECT r.id, p.permission_key
FROM public.roles r
CROSS JOIN (VALUES ('blog.view'), ('blog.manage')) AS p(permission_key)
WHERE r.is_super_admin = true
ON CONFLICT (role_id, permission_key) DO NOTHING;

-- Grant blog.view permission to Admin and Manager roles
INSERT INTO public.role_permissions (role_id, permission_key)
SELECT r.id, 'blog.view'
FROM public.roles r
WHERE r.name IN ('Admin', 'Manager')
  AND NOT r.is_super_admin
ON CONFLICT (role_id, permission_key) DO NOTHING;

-- Grant blog.manage permission to Admin role only
INSERT INTO public.role_permissions (role_id, permission_key)
SELECT r.id, 'blog.manage'
FROM public.roles r
WHERE r.name = 'Admin'
  AND NOT r.is_super_admin
ON CONFLICT (role_id, permission_key) DO NOTHING;

-- Add comments for documentation
COMMENT ON COLUMN public.permissions.permission_key IS 'Unique key for the permission (e.g., blog.view, blog.manage)';
COMMENT ON TABLE public.role_permissions IS 'Mapping between roles and their assigned permissions';
