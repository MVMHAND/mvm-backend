/**
 * Main Store
 * Combines all slices into a single store with SSR support
 */

import { createStore as createZustandStore } from 'zustand/vanilla'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AppStore, StoreInitialState, Theme } from './types'
import { createAuthSlice } from './slices/authSlice'
import { createUISlice } from './slices/uiSlice'

// Default initial state
const defaultInitialState: StoreInitialState = {
  user: null,
  permissions: [],
  menuItems: [],
  theme: 'light',
  sidebarCollapsed: false,
}

/**
 * Create a new store instance
 * This is called per-request in SSR to avoid shared state
 */
export function createStore(initialState: StoreInitialState = {}) {
  const mergedInitialState = { ...defaultInitialState, ...initialState }

  return createZustandStore<AppStore>()(
    persist(
      (...args) => ({
        ...createAuthSlice(...args),
        ...createUISlice(...args),
        // Override with initial state
        user: mergedInitialState.user ?? null,
        permissions: mergedInitialState.permissions ?? [],
        menuItems: mergedInitialState.menuItems ?? [],
        isAuthenticated: mergedInitialState.user !== null,
        theme: mergedInitialState.theme ?? 'light',
        sidebarCollapsed: mergedInitialState.sidebarCollapsed ?? false,
      }),
      {
        name: 'mvm-ui-storage',
        storage: createJSONStorage(() => {
          // Only use localStorage on the client
          if (typeof window === 'undefined') {
            return {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            }
          }
          return localStorage
        }),
        // Only persist UI preferences, not auth data
        partialize: (state) => ({
          theme: state.theme,
          sidebarCollapsed: state.sidebarCollapsed,
          // Convert Set to Array for JSON serialization
          sidebarExpandedItems: Array.from(state.sidebarExpandedItems),
        }),
        // Custom merge to handle Set conversion
        merge: (persistedState, currentState) => {
          const persisted = persistedState as {
            theme?: Theme
            sidebarCollapsed?: boolean
            sidebarExpandedItems?: string[]
          }
          return {
            ...currentState,
            theme: persisted?.theme ?? currentState.theme,
            sidebarCollapsed: persisted?.sidebarCollapsed ?? currentState.sidebarCollapsed,
            sidebarExpandedItems: new Set(persisted?.sidebarExpandedItems ?? []),
          }
        },
      }
    )
  )
}

// Type for the store instance
export type AppStoreApi = ReturnType<typeof createStore>

// Re-export types
export type { AppStore, AuthSlice, UISlice, AuthUser, Theme, StoreInitialState } from './types'
