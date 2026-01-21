'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { exportAuditLogsAction } from '@/actions/audit'
import type { AuditLogEntry } from '@/types'

interface AuditLogExportProps {
  filters: {
    actionType?: string
    actorId?: string
    targetType?: string
    startDate?: string
    endDate?: string
  }
}

export function AuditLogExport({ filters }: AuditLogExportProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)

    try {
      const result = await exportAuditLogsAction(filters)

      if (!result.success || !result.data) {
        console.error('Export failed:', result.error)
        setIsExporting(false)
        return
      }

      // Create CSV content
      const headers = [
        'Date',
        'Action',
        'Actor',
        'Actor Email',
        'Target Type',
        'Target ID',
        'Metadata',
      ]
      const rows = result.data.map((log: AuditLogEntry) => [
        log.created_at,
        log.action_type,
        log.actor?.name || 'System',
        log.actor?.email || '',
        log.target_type,
        log.target_id || '',
        JSON.stringify(log.metadata || {}),
      ])

      const csvContent: string = [
        headers.join(','),
        ...rows.map((row: string[]) =>
          row.map((cell: string) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ),
      ].join('\n')

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export error:', error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button variant="outline" onClick={handleExport} disabled={isExporting}>
      {isExporting ? (
        <>
          <svg className="-ml-1 mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
          Exporting...
        </>
      ) : (
        <>
          <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Export CSV
        </>
      )}
    </Button>
  )
}
