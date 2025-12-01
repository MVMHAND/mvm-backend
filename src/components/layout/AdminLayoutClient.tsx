'use client'

import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { StoreProvider } from '@/store/provider'
import type { MenuItem } from '@/config/menu'
import type { AuthUser } from '@/store/types'

interface AdminLayoutClientProps {
  children: React.ReactNode
  menuItems: MenuItem[]
  userPermissions: string[]
  user: AuthUser
}

export function AdminLayoutClient({
  children,
  menuItems,
  userPermissions,
  user,
}: AdminLayoutClientProps) {
  return (
    <StoreProvider
      initialState={{
        user,
        permissions: userPermissions,
        menuItems,
      }}
    >
      <div className="min-h-screen bg-gray-50">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content area */}
        <div className="pl-64">
          {/* Top bar */}
          <TopBar />

          {/* Page content - with consistent min-height for content area */}
          <main className="min-h-[calc(100vh-4rem)] pt-16">{children}</main>
        </div>
      </div>
    </StoreProvider>
  )
}
