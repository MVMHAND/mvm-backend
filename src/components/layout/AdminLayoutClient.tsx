'use client'

import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import type { MenuItem } from '@/config/menu'

interface AdminLayoutClientProps {
  children: React.ReactNode
  menuItems: MenuItem[]
  userPermissions: string[]
  user: {
    id: string
    name: string
    email: string
    avatar_url: string | null
    role: {
      name: string
      is_super_admin: boolean
    }
  }
}

export function AdminLayoutClient({
  children,
  menuItems,
  userPermissions,
  user,
}: AdminLayoutClientProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar menuItems={menuItems} userPermissions={userPermissions} />

      {/* Main content area */}
      <div className="pl-64">
        {/* Top bar */}
        <TopBar user={user} />

        {/* Page content - with consistent min-height for content area */}
        <main className="min-h-[calc(100vh-4rem)] pt-16">{children}</main>
      </div>
    </div>
  )
}
