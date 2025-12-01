/**
 * Auth Slice
 * Manages user authentication state and permissions
 */

import type { StateCreator } from 'zustand'
import type { AppStore, AuthSlice, AuthUser } from '../types'
import type { MenuItem } from '@/config/menu'

const initialAuthState = {
  user: null as AuthUser | null,
  permissions: [] as string[],
  menuItems: [] as MenuItem[],
  isAuthenticated: false,
}

export const createAuthSlice: StateCreator<AppStore, [], [], AuthSlice> = (set, get) => ({
  ...initialAuthState,

  setUser: (user: AuthUser | null) => {
    set({
      user,
      isAuthenticated: user !== null,
    })
  },

  setPermissions: (permissions: string[]) => {
    set({ permissions })
  },

  setMenuItems: (menuItems: MenuItem[]) => {
    set({ menuItems })
  },

  clearAuth: () => {
    set({
      ...initialAuthState,
    })
  },

  hasPermission: (permissionKey: string): boolean => {
    const state = get()
    // Super Admin has all permissions
    if (state.user?.role.is_super_admin) {
      return true
    }
    // Check if user has the specific permission
    return state.permissions.includes(permissionKey)
  },

  isSuperAdmin: (): boolean => {
    const state = get()
    return state.user?.role.is_super_admin ?? false
  },
})
