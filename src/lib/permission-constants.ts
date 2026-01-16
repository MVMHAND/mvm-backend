/**
 * Permission Constants
 * Centralized permission keys to prevent typos and provide autocomplete
 *
 * Usage:
 *   import { Permissions } from '@/lib/permission-constants'
 *   await requirePermission(Permissions.BLOG_CREATE)
 */
export const Permissions = {
  // User Permissions
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_EDIT: 'users.edit',
  USERS_DELETE: 'users.delete',

  // Role Permissions
  ROLES_VIEW: 'roles.view',
  ROLES_EDIT: 'roles.edit',

  // Blog Permissions
  BLOG_VIEW: 'blog.view',
  BLOG_EDIT: 'blog.edit',
  BLOG_DELETE: 'blog.delete',
  BLOG_PUBLISH: 'blog.publish',
  BLOG_CATEGORIES_MANAGE: 'blog.categories.manage',
  BLOG_CONTRIBUTORS_MANAGE: 'blog.contributors.manage',

  // Audit Permissions
  AUDIT_VIEW: 'audit.view',

  // Settings Permissions
  SETTINGS_MANAGE: 'settings.manage',
} as const

// Type for permission keys
export type PermissionKey = (typeof Permissions)[keyof typeof Permissions]

// Helper to get all permissions as array
export const getAllPermissionKeys = (): PermissionKey[] => {
  return Object.values(Permissions)
}

// Helper to validate a permission key
export const isValidPermission = (key: string): key is PermissionKey => {
  return Object.values(Permissions).includes(key as PermissionKey)
}

// Grouped permissions for easier management
export const PermissionGroups = {
  USERS: [
    Permissions.USERS_VIEW,
    Permissions.USERS_CREATE,
    Permissions.USERS_EDIT,
    Permissions.USERS_DELETE,
  ],
  ROLES: [Permissions.ROLES_VIEW, Permissions.ROLES_EDIT],
  BLOG: [
    Permissions.BLOG_VIEW,
    Permissions.BLOG_CREATE,
    Permissions.BLOG_EDIT,
    Permissions.BLOG_DELETE,
    Permissions.BLOG_PUBLISH,
    Permissions.BLOG_CATEGORIES_MANAGE,
    Permissions.BLOG_CONTRIBUTORS_MANAGE,
  ],
  AUDIT: [Permissions.AUDIT_VIEW],
  SETTINGS: [Permissions.SETTINGS_MANAGE],
} as const
