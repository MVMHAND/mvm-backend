/**
 * UI Slice
 * Manages UI state like sidebar, theme, and mobile menu
 */

import type { StateCreator } from 'zustand'
import type { AppStore, UISlice, Theme } from '../types'

const initialUIState = {
  sidebarCollapsed: false,
  sidebarExpandedItems: new Set<string>(),
  theme: 'light' as Theme,
  isMobileMenuOpen: false,
}

export const createUISlice: StateCreator<AppStore, [], [], UISlice> = (set) => ({
  ...initialUIState,

  toggleSidebar: () => {
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }))
  },

  setSidebarCollapsed: (collapsed: boolean) => {
    set({ sidebarCollapsed: collapsed })
  },

  toggleSidebarItem: (itemId: string) => {
    set((state) => {
      const newExpandedItems = new Set(state.sidebarExpandedItems)
      if (newExpandedItems.has(itemId)) {
        newExpandedItems.delete(itemId)
      } else {
        newExpandedItems.add(itemId)
      }
      return { sidebarExpandedItems: newExpandedItems }
    })
  },

  expandSidebarItem: (itemId: string) => {
    set((state) => {
      const newExpandedItems = new Set(state.sidebarExpandedItems)
      newExpandedItems.add(itemId)
      return { sidebarExpandedItems: newExpandedItems }
    })
  },

  collapseSidebarItem: (itemId: string) => {
    set((state) => {
      const newExpandedItems = new Set(state.sidebarExpandedItems)
      newExpandedItems.delete(itemId)
      return { sidebarExpandedItems: newExpandedItems }
    })
  },

  setTheme: (theme: Theme) => {
    set({ theme })
  },

  toggleMobileMenu: () => {
    set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen }))
  },

  closeMobileMenu: () => {
    set({ isMobileMenuOpen: false })
  },
})
