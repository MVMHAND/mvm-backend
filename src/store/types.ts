/**
 * Store type definitions
 * Central location for all Zustand store types
 */

import type { MenuItem } from '@/config/menu'

// ============================================================================
// Auth Slice Types
// ============================================================================

export interface AuthUser {
  id: string
  name: string
  email: string
  avatar_url: string | null
  role: {
    name: string
    is_super_admin: boolean
  }
}

export interface AuthSlice {
  // State
  user: AuthUser | null
  permissions: string[]
  menuItems: MenuItem[]
  isAuthenticated: boolean

  // Actions
  setUser: (user: AuthUser | null) => void
  setPermissions: (permissions: string[]) => void
  setMenuItems: (menuItems: MenuItem[]) => void
  clearAuth: () => void
  hasPermission: (permissionKey: string) => boolean
  isSuperAdmin: () => boolean
}

// ============================================================================
// UI Slice Types
// ============================================================================

export type Theme = 'light' | 'dark' | 'system'

export interface UISlice {
  // State
  sidebarCollapsed: boolean
  sidebarExpandedItems: Set<string>
  theme: Theme
  isMobileMenuOpen: boolean

  // Actions
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebarItem: (itemId: string) => void
  expandSidebarItem: (itemId: string) => void
  collapseSidebarItem: (itemId: string) => void
  setTheme: (theme: Theme) => void
  toggleMobileMenu: () => void
  closeMobileMenu: () => void
}

// ============================================================================
// Combined Store Type
// ============================================================================

export interface AppStore extends AuthSlice, UISlice {}

// ============================================================================
// Store Initialization Types
// ============================================================================

export interface StoreInitialState {
  user?: AuthUser | null
  permissions?: string[]
  menuItems?: MenuItem[]
  theme?: Theme
  sidebarCollapsed?: boolean
}
