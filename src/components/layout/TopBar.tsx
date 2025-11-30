'use client'

import { useState } from 'react'
import { LogOut, User, Settings, ChevronDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { logoutAction } from '@/actions/auth'
import { getInitials } from '@/lib/utils'
import { Breadcrumb } from './Breadcrumb'

interface TopBarProps {
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

export function TopBar({ user }: TopBarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await logoutAction()
    router.push('/admin/login')
  }

  return (
    <header className="fixed left-64 right-0 top-0 z-30 border-b border-gray-200 bg-white">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left side - breadcrumbs */}
        <div className="flex items-center">
          <Breadcrumb />
        </div>

        {/* Right side - User menu */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-gray-100"
          >
            {/* Avatar */}
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-mvm-blue text-sm font-semibold text-white">
                {getInitials(user.name)}
              </div>
            )}

            {/* User info */}
            <div className="hidden text-left md:block">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{user.role.name}</p>
            </div>

            <ChevronDown
              className={`h-4 w-4 text-gray-500 transition-transform ${
                isDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Dropdown menu */}
          {isDropdownOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsDropdownOpen(false)}
              />

              {/* Menu */}
              <div className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg">
                {/* User info in dropdown */}
                <div className="border-b border-gray-200 p-4">
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  {user.role.is_super_admin && (
                    <span className="mt-2 inline-flex rounded-full bg-purple-100 px-2 py-1 text-xs font-semibold text-purple-800">
                      Super Admin
                    </span>
                  )}
                </div>

                {/* Menu items */}
                <div className="p-2">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false)
                      router.push(`/admin/users/${user.id}`)
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
                  >
                    <User className="h-4 w-4" />
                    <span>My Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false)
                      router.push('/admin/settings/general')
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </button>
                </div>

                {/* Logout */}
                <div className="border-t border-gray-200 p-2">
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
