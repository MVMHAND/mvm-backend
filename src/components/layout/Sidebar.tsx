'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Shield,
  FileText,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  FolderOpen,
  Menu,
} from 'lucide-react'
import { useAppStore, useSidebar } from '@/store/provider'
import type { MenuItem } from '@/config/menu'

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Users,
  Shield,
  FileText,
  BookOpen,
  FolderOpen,
}

export function Sidebar() {
  const pathname = usePathname()

  // Get state from Zustand store
  const menuItems = useAppStore((state) => state.menuItems)
  const hasPermission = useAppStore((state) => state.hasPermission)
  const { collapsed, toggle, expandedItems, toggleItem } = useSidebar()

  // Filter menu items based on permissions
  const filterMenuItems = (items: MenuItem[]): MenuItem[] => {
    return items
      .filter((item) => {
        // No permission required = always visible
        if (!item.permissionKey) {
          return true
        }
        // Check if user has the permission
        return hasPermission(item.permissionKey)
      })
      .map((item) => ({
        ...item,
        children: item.children ? filterMenuItems(item.children) : undefined,
      }))
  }

  const filteredMenu = filterMenuItems(menuItems)

  const renderMenuItem = (item: MenuItem, depth = 0) => {
    const Icon = item.icon ? iconMap[item.icon] : null
    const isActive = item.path === pathname
    const isExpanded = expandedItems.has(item.id)
    const hasChildren = item.children && item.children.length > 0

    // For items with children (only show if not collapsed)
    if (hasChildren && !collapsed) {
      return (
        <div key={item.id}>
          <button
            onClick={() => toggleItem(item.id)}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              depth > 0 ? 'ml-4' : ''
            } ${
              isExpanded
                ? 'bg-mvm-blue/10 text-mvm-blue'
                : 'text-gray-700 hover:bg-gray-100 hover:text-mvm-blue'
            }`}
          >
            <div className="flex items-center gap-3">
              {Icon && <Icon className="h-5 w-5" />}
              <span>{item.label}</span>
            </div>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          {isExpanded && item.children && (
            <div className="mt-1 space-y-1">
              {item.children.map((child) => renderMenuItem(child, depth + 1))}
            </div>
          )}
        </div>
      )
    }

    // When collapsed, show first child path for parent items
    const linkPath = hasChildren && collapsed && item.children?.[0]?.path
      ? item.children[0].path
      : item.path || '#'

    // For regular menu items or collapsed parent items
    return (
      <Link
        key={item.id}
        href={linkPath}
        title={collapsed ? item.label : undefined}
        className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          depth > 0 && !collapsed ? 'ml-4' : ''
        } ${collapsed ? 'justify-center' : 'gap-3'} ${
          isActive
            ? 'bg-mvm-blue text-white'
            : 'text-gray-700 hover:bg-gray-100 hover:text-mvm-blue'
        }`}
      >
        {Icon && <Icon className={collapsed ? 'h-5 w-5' : 'h-5 w-5'} />}
        {!collapsed && <span>{item.label}</span>}
        {!collapsed && item.badge && (
          <span className="ml-auto rounded-full bg-mvm-yellow px-2 py-0.5 text-xs font-semibold text-gray-900">
            {item.badge}
          </span>
        )}
      </Link>
    )
  }

  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen border-r border-gray-200 bg-white transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="flex h-full flex-col">
        {/* Logo/Brand */}
        <div className={`flex h-16 items-center border-b border-gray-200 ${collapsed ? 'justify-center px-2' : 'justify-between px-3'}`}>
          {!collapsed && (
            <Link href="/admin" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-mvm-blue to-mvm-yellow">
                <span className="text-sm font-bold text-white">MV</span>
              </div>
              <span className="text-lg font-bold text-gray-900">My Virtual Mate</span>
            </Link>
          )}
          <button
            onClick={toggle}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <Menu className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2">
          <div className="space-y-1">{filteredMenu.map((item) => renderMenuItem(item))}</div>
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="border-t border-gray-200 p-4">
            <p className="text-xs text-gray-500">© 2024 My Virtual Mate</p>
            <p className="text-xs text-gray-400">Admin Panel v1.0</p>
          </div>
        )}
      </div>
    </aside>
  )
}
