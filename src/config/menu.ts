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
    permissionKey: 'users.view',
    relatedPermissions: [
      { key: 'users.view', label: 'View Users', group: 'Users', description: 'View user list and details' },
      { key: 'users.create', label: 'Create Users', group: 'Users', description: 'Invite and create new users' },
      { key: 'users.edit', label: 'Edit Users', group: 'Users', description: 'Edit user information' },
      { key: 'users.delete', label: 'Delete Users', group: 'Users', description: 'Delete or deactivate users' },
    ],
  },
  {
    id: 'roles',
    label: 'Roles & Permissions',
    path: '/admin/roles',
    icon: 'Shield',
    permissionKey: 'roles.view',
    relatedPermissions: [
      { key: 'roles.view', label: 'View Roles', group: 'Roles', description: 'View roles and permissions' },
      { key: 'roles.create', label: 'Create Roles', group: 'Roles', description: 'Create new roles' },
      { key: 'roles.edit', label: 'Edit Roles', group: 'Roles', description: 'Edit role information and permissions' },
      { key: 'roles.delete', label: 'Delete Roles', group: 'Roles', description: 'Delete roles' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'Settings',
    permissionKey: 'settings.view',
    relatedPermissions: [
      { key: 'settings.view', label: 'View Settings', group: 'Settings', description: 'View system settings' },
      { key: 'settings.edit', label: 'Edit Settings', group: 'Settings', description: 'Modify system settings' },
    ],
    children: [
      {
        id: 'settings-general',
        label: 'General',
        path: '/admin/settings/general',
        permissionKey: 'settings.view',
      },
      {
        id: 'settings-security',
        label: 'Security',
        path: '/admin/settings/security',
        permissionKey: 'settings.view',
      },
    ],
  },
  {
    id: 'audit',
    label: 'Audit Logs',
    path: '/admin/audit',
    icon: 'FileText',
    permissionKey: 'audit.view',
    relatedPermissions: [
      { key: 'audit.view', label: 'View Audit Logs', group: 'Audit', description: 'View system audit logs' },
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
