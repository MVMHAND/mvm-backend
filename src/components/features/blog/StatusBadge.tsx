import { cn } from '@/lib/utils'
import type { BlogPostStatus } from '@/types'

interface StatusBadgeProps {
  status: BlogPostStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusConfig = {
    draft: {
      label: 'Draft',
      className: 'bg-gray-100 text-gray-800 border-gray-300',
    },
    published: {
      label: 'Published',
      className: 'bg-green-100 text-green-800 border-green-300',
    },
    unpublished: {
      label: 'Unpublished',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    },
  }

  const config = statusConfig[status]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
