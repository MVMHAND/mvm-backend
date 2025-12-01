'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getAuditLogsAction } from '@/actions/audit'
import { formatDateTime } from '@/lib/utils'
import type { AuditLogEntry } from '@/types'

interface AuditLogTableProps {
  page: number
  filters: {
    actionType?: string
    actorId?: string
    targetType?: string
    startDate?: string
    endDate?: string
  }
}

export function AuditLogTable({ page, filters }: AuditLogTableProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 0,
  })

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true)
      setError(null)

      const result = await getAuditLogsAction({
        page,
        limit: 50,
        ...filters,
      })

      if (!result.success) {
        setError(result.error || 'Failed to fetch audit logs')
        setLoading(false)
        return
      }

      if (result.data) {
        setLogs(result.data.logs)
        setPagination({
          total: result.data.total,
          page: result.data.page,
          limit: result.data.limit,
          totalPages: result.data.totalPages,
        })
      }

      setLoading(false)
    }

    fetchLogs()
  }, [page, filters])

  const getActionBadgeColor = (actionType: string): string => {
    if (actionType.startsWith('auth.login.success')) return 'bg-green-100 text-green-800'
    if (actionType.startsWith('auth.login.failure')) return 'bg-red-100 text-red-800'
    if (actionType.startsWith('auth.')) return 'bg-blue-100 text-blue-800'
    if (actionType.startsWith('user.delete')) return 'bg-red-100 text-red-800'
    if (actionType.startsWith('user.')) return 'bg-purple-100 text-purple-800'
    if (actionType.startsWith('role.')) return 'bg-yellow-100 text-yellow-800'
    if (actionType.startsWith('permission.')) return 'bg-indigo-100 text-indigo-800'
    return 'bg-gray-100 text-gray-800'
  }

  const formatActionType = (actionType: string): string => {
    return actionType
      .split('.')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' › ')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-mvm-blue border-t-transparent"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-800">
        <p className="font-medium">Error</p>
        <p>{error}</p>
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">No audit logs found</p>
      </div>
    )
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                Date & Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                Action
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                Actor
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                Target
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                  {formatDateTime(log.created_at)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getActionBadgeColor(log.action_type)}`}
                  >
                    {formatActionType(log.action_type)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  {log.actor ? (
                    <div>
                      <p className="font-medium text-gray-900">{log.actor.name}</p>
                      <p className="text-gray-500">{log.actor.email}</p>
                    </div>
                  ) : (
                    <span className="text-gray-400">System</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium text-gray-900">
                      {log.target_type.charAt(0).toUpperCase() + log.target_type.slice(1)}
                    </p>
                    {log.target_id && (
                      <p className="font-mono text-xs text-gray-500">{log.target_id.slice(0, 8)}...</p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">
                  {log.metadata && Object.keys(log.metadata).length > 0 ? (
                    <details className="cursor-pointer">
                      <summary className="text-mvm-blue hover:underline">View metadata</summary>
                      <pre className="mt-2 max-w-xs overflow-x-auto rounded bg-gray-50 p-2 text-xs">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </details>
                  ) : (
                    <span className="text-gray-400">No metadata</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-gray-200 px-4 py-3">
          <div className="text-sm text-gray-600">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}{' '}
            logs
          </div>
          <div className="flex gap-2">
            <Link
              href={`/admin/audit-logs?page=${pagination.page - 1}${filters.actionType ? `&actionType=${filters.actionType}` : ''}${filters.targetType ? `&targetType=${filters.targetType}` : ''}${filters.startDate ? `&startDate=${filters.startDate}` : ''}${filters.endDate ? `&endDate=${filters.endDate}` : ''}`}
              className={`rounded-md border border-gray-300 px-3 py-2 text-sm font-medium ${
                pagination.page <= 1
                  ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
              aria-disabled={pagination.page <= 1}
            >
              Previous
            </Link>
            <span className="flex items-center px-3 text-sm text-gray-700">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Link
              href={`/admin/audit-logs?page=${pagination.page + 1}${filters.actionType ? `&actionType=${filters.actionType}` : ''}${filters.targetType ? `&targetType=${filters.targetType}` : ''}${filters.startDate ? `&startDate=${filters.startDate}` : ''}${filters.endDate ? `&endDate=${filters.endDate}` : ''}`}
              className={`rounded-md border border-gray-300 px-3 py-2 text-sm font-medium ${
                pagination.page >= pagination.totalPages
                  ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
              aria-disabled={pagination.page >= pagination.totalPages}
            >
              Next
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
