'use client'

/**
 * Store Provider
 * SSR-compatible provider for Next.js App Router
 * Creates a new store instance per request to avoid shared state
 */

import { createContext, useContext, useRef, type ReactNode } from 'react'
import { useStore } from 'zustand'
import { createStore, type AppStoreApi, type AppStore, type StoreInitialState } from './index'

// Create context with null default
const StoreContext = createContext<AppStoreApi | null>(null)

interface StoreProviderProps {
  children: ReactNode
  initialState?: StoreInitialState
}

/**
 * Provider component that creates store per-request
 * Wrap your app or admin layout with this provider
 */
export function StoreProvider({ children, initialState }: StoreProviderProps) {
  const storeRef = useRef<AppStoreApi | null>(null)

  // Create store only once per component lifecycle
  if (!storeRef.current) {
    storeRef.current = createStore(initialState)
  }

  return <StoreContext.Provider value={storeRef.current}>{children}</StoreContext.Provider>
}

/**
 * Custom hook to access the store with selector
 * @param selector - Function to select specific state from the store
 * @returns Selected state value
 *
 * @example
 * // Select single value
 * const user = useAppStore(state => state.user)
 *
 * @example
 * // Select multiple values (use shallow comparison for objects)
 * const { user, permissions } = useAppStore(state => ({
 *   user: state.user,
 *   permissions: state.permissions
 * }))
 */
export function useAppStore<T>(selector: (state: AppStore) => T): T {
  const store = useContext(StoreContext)

  if (!store) {
    throw new Error('useAppStore must be used within a StoreProvider')
  }

  return useStore(store, selector)
}

/**
 * Hook to get the entire store API (for advanced use cases)
 * Prefer useAppStore with selectors for better performance
 */
export function useAppStoreApi(): AppStoreApi {
  const store = useContext(StoreContext)

  if (!store) {
    throw new Error('useAppStoreApi must be used within a StoreProvider')
  }

  return store
}

// ============================================================================
// Typed Selector Hooks (for common patterns)
// ============================================================================

/**
 * Hook for auth-related state
 */
export function useAuth() {
  return useAppStore((state) => ({
    user: state.user,
    permissions: state.permissions,
    isAuthenticated: state.isAuthenticated,
    hasPermission: state.hasPermission,
    isSuperAdmin: state.isSuperAdmin,
  }))
}

/**
 * Hook for user data only
 */
export function useUser() {
  return useAppStore((state) => state.user)
}

/**
 * Hook for permissions
 */
export function usePermissions() {
  return useAppStore((state) => state.permissions)
}

/**
 * Hook for menu items
 */
export function useMenuItems() {
  return useAppStore((state) => state.menuItems)
}

/**
 * Hook for UI state
 */
export function useUI() {
  return useAppStore((state) => ({
    sidebarCollapsed: state.sidebarCollapsed,
    sidebarExpandedItems: state.sidebarExpandedItems,
    theme: state.theme,
    isMobileMenuOpen: state.isMobileMenuOpen,
    toggleSidebar: state.toggleSidebar,
    setSidebarCollapsed: state.setSidebarCollapsed,
    toggleSidebarItem: state.toggleSidebarItem,
    setTheme: state.setTheme,
    toggleMobileMenu: state.toggleMobileMenu,
    closeMobileMenu: state.closeMobileMenu,
  }))
}

/**
 * Hook for sidebar state
 */
export function useSidebar() {
  return useAppStore((state) => ({
    collapsed: state.sidebarCollapsed,
    expandedItems: state.sidebarExpandedItems,
    toggle: state.toggleSidebar,
    setCollapsed: state.setSidebarCollapsed,
    toggleItem: state.toggleSidebarItem,
    expandItem: state.expandSidebarItem,
    collapseItem: state.collapseSidebarItem,
  }))
}

/**
 * Hook for theme
 */
export function useTheme() {
  return useAppStore((state) => ({
    theme: state.theme,
    setTheme: state.setTheme,
  }))
}
