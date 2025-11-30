'use client'

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { usePathname } from 'next/navigation'

interface BreadcrumbItem {
  label: string
  href?: string
}

export function Breadcrumb() {
  const pathname = usePathname()

  // Generate breadcrumb items from pathname
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    // Remove /admin prefix and split
    const paths = pathname.replace('/admin', '').split('/').filter(Boolean)

    const breadcrumbs: BreadcrumbItem[] = [
      {
        label: 'Dashboard',
        href: pathname === '/admin' ? undefined : '/admin',
      },
    ]

    let currentPath = '/admin'
    paths.forEach((path, index) => {
      currentPath += `/${path}`

      // Capitalize and format label
      const label = path
        .split('-')
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(' ')

      // Don't add href to the last item (current page)
      breadcrumbs.push({
        label,
        href: index === paths.length - 1 ? undefined : currentPath,
      })
    })

    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600">
      {breadcrumbs.map((item, index) => (
        <div key={item.label} className="flex items-center">
          {index > 0 && <ChevronRight className="mx-2 h-4 w-4 text-gray-400" />}

          {item.href ? (
            <Link
              href={item.href}
              className="flex items-center gap-1 transition-colors hover:text-mvm-blue"
            >
              {index === 0 && <Home className="h-4 w-4" />}
              <span>{item.label}</span>
            </Link>
          ) : (
            <span className="flex items-center gap-1 font-medium text-gray-900">
              {index === 0 && <Home className="h-4 w-4" />}
              <span>{item.label}</span>
            </span>
          )}
        </div>
      ))}
    </nav>
  )
}
