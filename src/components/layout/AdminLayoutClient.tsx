'use client'

import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { StoreProvider, useSidebar } from '@/store/provider'
import { ToastProvider } from '@/contexts/ToastContext'
import type { MenuItem } from '@/config/menu'
import type { AuthUser } from '@/store/types'

interface AdminLayoutClientProps {
  children: React.ReactNode
  menuItems: MenuItem[]
  userPermissions: string[]
  user: AuthUser
}

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div
        className={`transition-all duration-300 ${collapsed ? 'pl-16' : 'pl-64'}`}
      >
        {/* Top bar */}
        <TopBar />

        {/* Page content - with consistent min-height for content area */}
        <main className="min-h-[calc(100vh-4rem)] pt-16">{children}</main>
      </div>
    </div>
  )
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
      <ToastProvider>
        <AdminLayoutContent>{children}</AdminLayoutContent>
      </ToastProvider>
    </StoreProvider>
  )
}
