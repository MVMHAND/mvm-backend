'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

// Column definition type
export interface Column<T> {
  key: string
  header: string
  headerAlign?: 'left' | 'center' | 'right'
  cellAlign?: 'left' | 'center' | 'right'
  render: (item: T) => ReactNode
  className?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyExtractor: (item: T) => string
  emptyMessage?: string
  className?: string
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  emptyMessage = 'No data found',
  className,
}: DataTableProps<T>): ReactNode {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
        <p className="text-gray-600">{emptyMessage}</p>
      </div>
    )
  }

  const getAlignClass = (align?: 'left' | 'center' | 'right'): string => {
    switch (align) {
      case 'center':
        return 'text-center'
      case 'right':
        return 'text-right'
      default:
        return 'text-left'
    }
  }

  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm',
        className
      )}
    >
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  'px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500',
                  getAlignClass(column.headerAlign)
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {data.map((item) => (
            <tr key={keyExtractor(item)} className="hover:bg-gray-50">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn(
                    'whitespace-nowrap px-6 py-4',
                    getAlignClass(column.cellAlign),
                    column.className
                  )}
                >
                  {column.render(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Common cell components for reuse
interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple'
  className?: string
}

export function TableBadge({ children, variant = 'default', className }: BadgeProps): ReactNode {
  const variantClasses: Record<string, string> = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    purple: 'bg-purple-100 text-purple-800',
  }

  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-1 text-xs font-semibold',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

interface AvatarCellProps {
  name: string
  email?: string
  avatarUrl?: string | null
  initials?: string
}

export function AvatarCell({ name, email, avatarUrl, initials }: AvatarCellProps): ReactNode {
  const displayInitials =
    initials ||
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

  return (
    <div className="flex items-center">
      <div className="h-10 w-10 flex-shrink-0">
        {avatarUrl ? (
          <img className="h-10 w-10 rounded-full object-cover" src={avatarUrl} alt={name} />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-mvm-blue text-white">
            {displayInitials}
          </div>
        )}
      </div>
      <div className="ml-4">
        <div className="text-sm font-medium text-gray-900">{name}</div>
        {email && <div className="text-sm text-gray-500">{email}</div>}
      </div>
    </div>
  )
}

interface TextCellProps {
  primary: string
  secondary?: string
  className?: string
}

export function TextCell({ primary, secondary, className }: TextCellProps): ReactNode {
  return (
    <div className={className}>
      <div className="text-sm font-medium text-gray-900">{primary}</div>
      {secondary && <p className="mt-1 text-sm text-gray-500">{secondary}</p>}
    </div>
  )
}

interface DateCellProps {
  date: string
  formatter?: (date: string) => string
}

export function DateCell({ date, formatter }: DateCellProps): ReactNode {
  const formattedDate = formatter ? formatter(date) : date
  return <span className="text-sm text-gray-500">{formattedDate}</span>
}
