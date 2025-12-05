-- ================================================
-- SEED INITIAL DATA
-- ================================================
-- Insert default roles, permissions, and role assignments

-- ================================================
-- SEED ROLES
-- ================================================
INSERT INTO user_roles (name, description, is_super_admin, is_system)
VALUES ('Super Admin', 'System super administrator with full access', TRUE, TRUE);

INSERT INTO user_roles (name, description, is_system)
VALUES 
    ('Admin', 'Administrator with most permissions', TRUE),
    ('Manager', 'Manager with limited administrative permissions', TRUE),
    ('Support', 'Support staff with read-only access', TRUE);

-- ================================================
-- SEED PERMISSIONS
-- ================================================
-- Users permissions
INSERT INTO user_permissions (permission_key, label, description, "group")
VALUES
    ('users.view', 'View Users', 'View user list and details', 'Users'),
    ('users.create', 'Create Users', 'Invite and create new users', 'Users'),
    ('users.edit', 'Edit Users', 'Edit user information', 'Users'),
    ('users.delete', 'Delete Users', 'Delete or deactivate users', 'Users');

-- Roles permissions
INSERT INTO user_permissions (permission_key, label, description, "group")
VALUES
    ('roles.view', 'View Roles', 'View roles and permissions', 'Roles'),
    ('roles.create', 'Create Roles', 'Create new roles', 'Roles'),
    ('roles.edit', 'Edit Roles', 'Edit role information and permissions', 'Roles'),
    ('roles.delete', 'Delete Roles', 'Delete roles', 'Roles');

-- Blog permissions
INSERT INTO user_permissions (permission_key, label, description, "group")
VALUES
    ('blog.view', 'View Blog', 'View blog posts, categories, and contributors', 'Blog'),
    ('blog.manage', 'Manage Blog', 'Full blog management (create, edit, delete, publish)', 'Blog');

-- Audit permissions
INSERT INTO user_permissions (permission_key, label, description, "group")
VALUES
    ('audit.view', 'View Audit Logs', 'View system audit logs (Super Admin only)', 'Audit');

-- ================================================
-- ASSIGN PERMISSIONS TO ROLES
-- ================================================
-- Assign all permissions to Admin role (Super Admin bypasses permission checks)
INSERT INTO user_role_permissions (role_id, permission_key)
SELECT r.id, p.permission_key
FROM user_roles r
CROSS JOIN user_permissions p
WHERE r.name = 'Admin';

-- Assign limited permissions to Manager role
INSERT INTO user_role_permissions (role_id, permission_key)
SELECT r.id, p.permission_key
FROM user_roles r
CROSS JOIN user_permissions p
WHERE r.name = 'Manager'
AND p.permission_key IN (
    'users.view', 'users.create', 'users.edit',
    'roles.view',
    'blog.view', 'blog.manage',
    'audit.view'
);

-- Assign read-only permissions to Support role
INSERT INTO user_role_permissions (role_id, permission_key)
SELECT r.id, p.permission_key
FROM user_roles r
CROSS JOIN user_permissions p
WHERE r.name = 'Support'
AND p.permission_key IN (
    'users.view',
    'roles.view',
    'blog.view'
);
