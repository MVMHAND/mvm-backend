import { Permissions } from '@/lib/permission-constants'

/**
 * Menu item structure
 * - id: Unique identifier for the menu item
 * - label: Display name
 * - path: Route path (for navigation)
 * - icon: Optional icon name (from lucide-react)
 * - permissionKey: Permission required to view this item (null = always visible)
 * - children: Nested menu items
 */
export interface MenuItem {
  id: string
  label: string
  path?: string
  icon?: string
  permissionKey?: string | null
  children?: MenuItem[]
  badge?: string
  relatedPermissions?: MenuPermissionMetadata[]
}

export interface MenuPermissionMetadata {
  key: string
  label: string
  group: string
  description: string
}

/**
 * MENU_CONFIG - Code-defined navigation structure
 * This is the single source of truth for navigation AND permissions
 * Menu items are filtered based on user permissions at runtime
 */
export const MENU_CONFIG: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/admin',
    icon: 'LayoutDashboard',
    permissionKey: null, // Always visible
  },
  {
    id: 'users',
    label: 'Users',
    path: '/admin/users',
    icon: 'Users',
    permissionKey: Permissions.USERS_VIEW,
    relatedPermissions: [
      {
        key: Permissions.USERS_VIEW,
        label: 'View Users',
        group: 'Users',
        description: 'View user list and details',
      },
      {
        key: Permissions.USERS_CREATE,
        label: 'Create Users',
        group: 'Users',
        description: 'Invite and create new users',
      },
      {
        key: Permissions.USERS_EDIT,
        label: 'Edit Users',
        group: 'Users',
        description: 'Edit user information',
      },
      {
        key: Permissions.USERS_DELETE,
        label: 'Delete Users',
        group: 'Users',
        description: 'Delete or deactivate users',
      },
    ],
  },
  {
    id: 'roles',
    label: 'Roles & Permissions',
    path: '/admin/roles',
    icon: 'Shield',
    permissionKey: Permissions.ROLES_VIEW,
    relatedPermissions: [
      {
        key: Permissions.ROLES_VIEW,
        label: 'View Roles',
        group: 'Roles',
        description: 'View roles and permissions',
      },
      {
        key: Permissions.ROLES_EDIT,
        label: 'Manage Roles',
        group: 'Roles',
        description: 'Create, edit, and delete roles and their permissions',
      },
    ],
  },
  {
    id: 'blog',
    label: 'Blog',
    icon: 'BookOpen',
    permissionKey: Permissions.BLOG_VIEW,
    relatedPermissions: [
      {
        key: Permissions.BLOG_VIEW,
        label: 'View Blog',
        group: 'Blog',
        description: 'View blog posts, categories, and contributors',
      },
      {
        key: Permissions.BLOG_EDIT,
        label: 'Create & Edit Blog Posts',
        group: 'Blog',
        description: 'Create and edit existing blog posts',
      },
      {
        key: Permissions.BLOG_DELETE,
        label: 'Delete Blog Posts',
        group: 'Blog',
        description: 'Delete blog posts',
      },
      {
        key: Permissions.BLOG_PUBLISH,
        label: 'Publish Blog Posts',
        group: 'Blog',
        description: 'Publish and unpublish blog posts',
      },
      {
        key: Permissions.BLOG_CATEGORIES_MANAGE,
        label: 'Manage Blog Categories',
        group: 'Blog',
        description: 'Create, edit, and delete blog categories',
      },
      {
        key: Permissions.BLOG_CONTRIBUTORS_MANAGE,
        label: 'Manage Blog Contributors',
        group: 'Blog',
        description: 'Create, edit, and delete blog contributors',
      },
    ],
    children: [
      {
        id: 'blog-posts',
        label: 'Posts',
        path: '/admin/blog/posts',
        icon: 'FileText',
        permissionKey: Permissions.BLOG_VIEW,
      },
      {
        id: 'blog-categories',
        label: 'Categories',
        path: '/admin/blog/categories',
        icon: 'FolderOpen',
        permissionKey: Permissions.BLOG_VIEW,
      },
      {
        id: 'blog-contributors',
        label: 'Contributors',
        path: '/admin/blog/contributors',
        icon: 'Users',
        permissionKey: Permissions.BLOG_VIEW,
      },
    ],
  },
  {
    id: 'job-posts',
    label: 'Job Posts',
    icon: 'Briefcase',
    permissionKey: Permissions.JOB_POSTS_VIEW,
    relatedPermissions: [
      {
        key: Permissions.JOB_POSTS_VIEW,
        label: 'View Job Posts',
        group: 'Job Posts',
        description: 'View job posts and categories',
      },
      {
        key: Permissions.JOB_POSTS_EDIT,
        label: 'Edit Job Posts',
        group: 'Job Posts',
        description: 'Create and edit job posts',
      },
      {
        key: Permissions.JOB_POSTS_PUBLISH,
        label: 'Publish Job Posts',
        group: 'Job Posts',
        description: 'Publish and unpublish job posts',
      },
      {
        key: Permissions.JOB_POSTS_DELETE,
        label: 'Delete Job Posts',
        group: 'Job Posts',
        description: 'Delete job posts',
      },
    ],
    children: [
      {
        id: 'job-posts-list',
        label: 'Posts',
        path: '/admin/job-posts/posts',
        icon: 'FileText',
        permissionKey: Permissions.JOB_POSTS_VIEW,
      },
      {
        id: 'job-posts-categories',
        label: 'Categories',
        path: '/admin/job-posts/categories',
        icon: 'FolderOpen',
        permissionKey: Permissions.JOB_POSTS_VIEW,
      },
    ],
  },
  {
    id: 'audit',
    label: 'Audit Logs',
    path: '/admin/audit-logs',
    icon: 'FileText',
    permissionKey: Permissions.AUDIT_VIEW,
    relatedPermissions: [
      {
        key: Permissions.AUDIT_VIEW,
        label: 'View Audit Logs',
        group: 'Audit',
        description:
          '⚠️ CAUTION: Access to audit logs can reveal sensitive information about all system activities, user actions, and changes. Grant this permission carefully.',
      },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'Settings',
    permissionKey: Permissions.SETTINGS_MANAGE,
    relatedPermissions: [
      {
        key: Permissions.SETTINGS_MANAGE,
        label: 'Manage Settings',
        group: 'Settings',
        description: 'Manage system settings',
      },
    ],
    children: [
      {
        id: 'allowed-domains',
        label: 'Allowed Domains',
        path: '/admin/settings/allowed-domains',
        icon: 'Globe',
        permissionKey: Permissions.SETTINGS_MANAGE,
      },
    ],
  },
]

/**
 * Get all permission keys used in the menu
 * This helps ensure permissions are synced to the database
 */
export function getAllMenuPermissions(): string[] {
  const permissions: string[] = []

  function extractPermissions(items: MenuItem[]) {
    items.forEach((item) => {
      if (item.permissionKey && !permissions.includes(item.permissionKey)) {
        permissions.push(item.permissionKey)
      }
      if (item.children) {
        extractPermissions(item.children)
      }
    })
  }

  extractPermissions(MENU_CONFIG)
  return permissions
}

/**
 * Returns all permission metadata extracted from MENU_CONFIG
 * This is the source of truth for permission sync
 */
export function getAllPermissionMetadata(): MenuPermissionMetadata[] {
  const allPermissions: MenuPermissionMetadata[] = []
  const seenKeys = new Set<string>()

  function extractPermissions(items: MenuItem[]) {
    items.forEach((item) => {
      // Add related permissions if defined
      if (item.relatedPermissions) {
        item.relatedPermissions.forEach((perm) => {
          if (!seenKeys.has(perm.key)) {
            allPermissions.push(perm)
            seenKeys.add(perm.key)
          }
        })
      }

      // Recursively process children
      if (item.children) {
        extractPermissions(item.children)
      }
    })
  }

  extractPermissions(MENU_CONFIG)
  return allPermissions
}
