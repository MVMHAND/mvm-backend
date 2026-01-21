'use client'

import { formatDateTime } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

interface AuditUser {
  name: string
  email: string
}

export interface AuditInfoProps {
  createdBy?: AuditUser | null
  createdAt: string
  updatedBy?: AuditUser | null
  updatedAt?: string | null
  publishedBy?: AuditUser | null
  publishedAt?: string | null
  variant?: 'compact' | 'detailed'
  className?: string
}

function formatUserDisplay(user?: AuditUser | null): string {
  if (!user) return 'Unknown'
  return user.name || user.email || 'Unknown'
}

function AuditField({
  label,
  user,
  timestamp,
}: {
  label: string
  user?: AuditUser | null
  timestamp?: string | null
}) {
  if (!timestamp) return null

  return (
    <div className="flex flex-col">
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="mt-1">
        <div className="text-sm font-medium text-gray-900">{formatUserDisplay(user)}</div>
        <div className="text-xs text-gray-500">{formatDateTime(timestamp)}</div>
      </dd>
    </div>
  )
}

function CompactAuditInfo({
  createdBy,
  createdAt,
  updatedBy,
  updatedAt,
  className,
}: AuditInfoProps) {
  const parts: string[] = []

  parts.push(`Created by ${formatUserDisplay(createdBy)} on ${formatDateTime(createdAt)}`)

  if (updatedAt && updatedAt !== createdAt) {
    parts.push(`Last updated by ${formatUserDisplay(updatedBy)} on ${formatDateTime(updatedAt)}`)
  }

  return (
    <div className={cn('text-xs text-gray-500', className)}>
      {parts.map((part, index) => (
        <span key={index}>
          {index > 0 && ' • '}
          {part}
        </span>
      ))}
    </div>
  )
}

function DetailedAuditInfo({
  createdBy,
  createdAt,
  updatedBy,
  updatedAt,
  publishedBy,
  publishedAt,
  className,
}: AuditInfoProps) {
  return (
    <Card className={cn('bg-gray-50', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium text-gray-700">Audit Information</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AuditField label="Created" user={createdBy} timestamp={createdAt} />
          {updatedAt && updatedAt !== createdAt && (
            <AuditField label="Last Updated" user={updatedBy} timestamp={updatedAt} />
          )}
          {publishedBy && (
            <AuditField label="Published" user={publishedBy} timestamp={publishedAt} />
          )}
        </dl>
      </CardContent>
    </Card>
  )
}

export function AuditInfo({ variant = 'detailed', ...props }: AuditInfoProps) {
  if (variant === 'compact') {
    return <CompactAuditInfo {...props} variant={variant} />
  }

  return <DetailedAuditInfo {...props} variant={variant} />
}
