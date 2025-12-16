'use client'

import { ReactNode, useState, useTransition, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface Column<T> {
  key: string
  header: string
  headerAlign?: 'left' | 'center' | 'right'
  cellAlign?: 'left' | 'center' | 'right'
  render: (item: T) => ReactNode
  className?: string
  sortable?: boolean
}

export interface FilterOption {
  value: string
  label: string
}

export interface FilterConfig {
  key: string
  label: string
  type: 'select' | 'date' | 'dateRange'
  options?: FilterOption[]
  placeholder?: string
}

export interface PaginationConfig {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface AdminTableProps<T> {
  // Data
  data: T[]
  columns: Column<T>[]
  keyExtractor: (item: T) => string

  // Search
  searchable?: boolean
  searchPlaceholder?: string
  searchParamKey?: string

  // Filters
  filters?: FilterConfig[]

  // Pagination
  pagination?: PaginationConfig
  pageSizeOptions?: number[]

  // Actions
  headerAction?: ReactNode
  bulkActions?: ReactNode

  // States
  loading?: boolean
  error?: string | null

  // Customization
  emptyMessage?: string
  emptyIcon?: ReactNode
  className?: string
  tableClassName?: string
}

// ============================================================================
// Hook: useTableUrlState
// ============================================================================

export function useTableUrlState() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const updateUrl = useCallback(
    (updates: Record<string, string | null>) => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString())

        Object.entries(updates).forEach(([key, value]) => {
          if (value === null || value === '') {
            params.delete(key)
          } else {
            params.set(key, value)
          }
        })

        const query = params.toString()
        const url = query ? `${pathname}?${query}` : pathname
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.push(url as any)
      })
    },
    [router, pathname, searchParams, startTransition]
  )

  const getParam = useCallback(
    (key: string, defaultValue: string = ''): string => {
      return searchParams.get(key) || defaultValue
    },
    [searchParams]
  )

  return { updateUrl, getParam, isPending, searchParams }
}

// ============================================================================
// Component: TableSearch
// ============================================================================

interface TableSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  isPending?: boolean
  className?: string
}

export function TableSearch({
  value,
  onChange,
  placeholder = 'Search...',
  isPending = false,
  className,
}: TableSearchProps): ReactNode {
  return (
    <div className={cn('relative', className)}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 px-4 py-2 pr-10 text-gray-900 placeholder-gray-400 focus:border-mvm-blue focus:outline-none focus:ring-2 focus:ring-mvm-blue/20"
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        {isPending ? (
          <svg
            className="h-5 w-5 animate-spin text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <svg
            className="h-5 w-5 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Component: TableSelectFilter
// ============================================================================

interface TableSelectFilterProps {
  value: string
  onChange: (value: string) => void
  options: FilterOption[]
  label?: string
  placeholder?: string
  className?: string
}

export function TableSelectFilter({
  value,
  onChange,
  options,
  label,
  placeholder = 'All',
  className,
}: TableSelectFilterProps): ReactNode {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-mvm-blue focus:outline-none focus:ring-2 focus:ring-mvm-blue/20"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

// ============================================================================
// Component: TableDateFilter
// ============================================================================

interface TableDateFilterProps {
  value: string
  onChange: (value: string) => void
  label?: string
  className?: string
}

export function TableDateFilter({
  value,
  onChange,
  label,
  className,
}: TableDateFilterProps): ReactNode {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-mvm-blue focus:outline-none focus:ring-2 focus:ring-mvm-blue/20"
      />
    </div>
  )
}

// ============================================================================
// Component: TablePagination
// ============================================================================

interface TablePaginationProps {
  page: number
  totalPages: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
  className?: string
}

export function TablePagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  className,
}: TablePaginationProps): ReactNode {
  if (totalPages <= 1) return null

  const startItem = (page - 1) * pageSize + 1
  const endItem = Math.min(page * pageSize, total)

  return (
    <div
      className={cn(
        'flex items-center justify-between border-t border-gray-200 px-4 py-3',
        className
      )}
    >
      <div className="text-sm text-gray-600">
        Showing {startItem} to {endItem} of {total} results
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Previous
        </Button>
        <span className="px-3 text-sm text-gray-700">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

// ============================================================================
// Component: TableEmpty
// ============================================================================

interface TableEmptyProps {
  message: string
  icon?: ReactNode
  colSpan: number
}

function TableEmpty({ message, icon, colSpan }: TableEmptyProps): ReactNode {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-12 text-center">
        {icon && <div className="mb-3 flex justify-center text-gray-400">{icon}</div>}
        <p className="text-gray-500">{message}</p>
      </td>
    </tr>
  )
}

// ============================================================================
// Component: TableLoading
// ============================================================================

interface TableLoadingProps {
  colSpan: number
}

function TableLoading({ colSpan }: TableLoadingProps): ReactNode {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-12 text-center">
        <div className="flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-mvm-blue border-t-transparent" />
        </div>
      </td>
    </tr>
  )
}

// ============================================================================
// Component: TableError
// ============================================================================

interface TableErrorProps {
  message: string
  onRetry?: () => void
}

export function TableError({ message, onRetry }: TableErrorProps): ReactNode {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <div className="flex items-center gap-3">
        <svg
          className="h-5 w-5 text-red-600"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
          />
        </svg>
        <p className="text-sm text-red-800">{message}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="ml-auto">
            Retry
          </Button>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Component: AdminTable (Main Component)
// ============================================================================

export function AdminTable<T>({
  data,
  columns,
  keyExtractor,
  searchable = false,
  searchPlaceholder = 'Search...',
  searchParamKey = 'search',
  filters,
  pagination,
  headerAction,
  bulkActions,
  loading = false,
  error = null,
  emptyMessage = 'No data found',
  emptyIcon,
  className,
  tableClassName,
}: AdminTableProps<T>): ReactNode {
  const { updateUrl, getParam, isPending } = useTableUrlState()
  const [localSearch, setLocalSearch] = useState(getParam(searchParamKey))

  // Handle search with debounce
  const handleSearch = useCallback(
    (value: string) => {
      setLocalSearch(value)
      // Reset to page 1 when searching
      updateUrl({ [searchParamKey]: value || null, page: null })
    },
    [updateUrl, searchParamKey]
  )

  // Handle filter change
  const handleFilterChange = useCallback(
    (key: string, value: string) => {
      updateUrl({ [key]: value || null, page: null })
    },
    [updateUrl]
  )

  // Handle page change
  const handlePageChange = useCallback(
    (newPage: number) => {
      updateUrl({ page: newPage > 1 ? String(newPage) : null })
    },
    [updateUrl]
  )

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    const updates: Record<string, null> = { [searchParamKey]: null, page: null }
    filters?.forEach((filter) => {
      updates[filter.key] = null
      if (filter.type === 'dateRange') {
        updates[`${filter.key}Start`] = null
        updates[`${filter.key}End`] = null
      }
    })
    setLocalSearch('')
    updateUrl(updates)
  }, [updateUrl, searchParamKey, filters])

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    if (localSearch) return true
    if (!filters) return false
    return filters.some((filter) => {
      if (filter.type === 'dateRange') {
        return getParam(`${filter.key}Start`) || getParam(`${filter.key}End`)
      }
      return getParam(filter.key)
    })
  }, [localSearch, filters, getParam])

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

  // Error state
  if (error) {
    return <TableError message={error} />
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toolbar: Search + Action on first row, Filters on second row */}
      {(searchable || filters || headerAction) && (
        <div className="space-y-4">
          {/* Row 1: Search bar (full width) + Action button */}
          {(searchable || headerAction) && (
            <div className="flex items-center gap-4">
              {searchable && (
                <TableSearch
                  value={localSearch}
                  onChange={handleSearch}
                  placeholder={searchPlaceholder}
                  isPending={isPending}
                  className="flex-1"
                />
              )}
              {headerAction && <div className="flex-shrink-0">{headerAction}</div>}
            </div>
          )}

          {/* Row 2: Filters */}
          {filters && filters.length > 0 && (
            <div className="flex flex-wrap items-end gap-3">
              {filters.map((filter) => {
                if (filter.type === 'select' && filter.options) {
                  return (
                    <TableSelectFilter
                      key={filter.key}
                      value={getParam(filter.key)}
                      onChange={(value) => handleFilterChange(filter.key, value)}
                      options={filter.options}
                      label={filter.label}
                      placeholder={filter.placeholder}
                    />
                  )
                }
                if (filter.type === 'date') {
                  return (
                    <TableDateFilter
                      key={filter.key}
                      value={getParam(filter.key)}
                      onChange={(value) => handleFilterChange(filter.key, value)}
                      label={filter.label}
                    />
                  )
                }
                if (filter.type === 'dateRange') {
                  return (
                    <div key={filter.key} className="flex items-end gap-2">
                      <TableDateFilter
                        value={getParam(`${filter.key}Start`)}
                        onChange={(value) => handleFilterChange(`${filter.key}Start`, value)}
                        label={`${filter.label} From`}
                      />
                      <TableDateFilter
                        value={getParam(`${filter.key}End`)}
                        onChange={(value) => handleFilterChange(`${filter.key}End`, value)}
                        label={`${filter.label} To`}
                      />
                    </div>
                  )
                }
                return null
              })}

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="text-gray-500"
                >
                  Clear filters
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Bulk Actions */}
      {bulkActions && <div className="flex items-center gap-2">{bulkActions}</div>}

      {/* Table */}
      <div
        className={cn(
          'overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm',
          tableClassName
        )}
      >
        <div className="overflow-x-auto">
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
              {loading ? (
                <TableLoading colSpan={columns.length} />
              ) : data.length === 0 ? (
                <TableEmpty message={emptyMessage} icon={emptyIcon} colSpan={columns.length} />
              ) : (
                data.map((item) => (
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
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && (
          <TablePagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            pageSize={pagination.pageSize}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      {/* Results count (when no pagination) */}
      {!pagination && data.length > 0 && (
        <div className="text-sm text-gray-500">
          Showing {data.length} result{data.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Re-export cell components from DataTable
// ============================================================================

export { TableBadge, AvatarCell, TextCell, DateCell } from '@/components/ui/DataTable'
