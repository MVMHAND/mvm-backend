'use client'

import { type ReactNode } from 'react'
import { Tooltip } from '@/components/ui/Tooltip'
import { formatDateTime } from '@/lib/utils'

interface AuditUser {
  name: string
  email: string
}

interface AuditTooltipProps {
  children: ReactNode
  createdBy?: AuditUser | null
  createdAt?: string | null
  updatedBy?: AuditUser | null
  updatedAt?: string | null
}

function formatUserDisplay(user?: AuditUser | null): string {
  if (!user) return 'Unknown'
  return user.name || user.email || 'Unknown'
}

export function AuditTooltip({
  children,
  createdBy,
  createdAt,
  updatedBy,
  updatedAt,
}: AuditTooltipProps) {
  const tooltipContent = (
    <div className="space-y-1.5">
      {createdAt && (
        <div>
          <div className="text-xs text-gray-400">Created by</div>
          <div className="font-medium">{formatUserDisplay(createdBy)}</div>
          <div className="text-xs text-gray-400">{formatDateTime(createdAt)}</div>
        </div>
      )}
      {updatedAt && updatedAt !== createdAt && (
        <div className="border-t border-gray-700 pt-1.5">
          <div className="text-xs text-gray-400">Last updated by</div>
          <div className="font-medium">{formatUserDisplay(updatedBy)}</div>
          <div className="text-xs text-gray-400">{formatDateTime(updatedAt)}</div>
        </div>
      )}
    </div>
  )

  return (
    <Tooltip content={tooltipContent} position="top">
      <span className="cursor-help border-b border-dotted border-gray-400">{children}</span>
    </Tooltip>
  )
}
