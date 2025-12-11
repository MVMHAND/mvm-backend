'use client'

import { cn } from '@/lib/utils'

interface LoadingOverlayProps {
  isLoading: boolean
  message?: string
  fullScreen?: boolean
}

export function LoadingOverlay({ isLoading, message, fullScreen = false }: LoadingOverlayProps) {
  if (!isLoading) return null

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm',
        fullScreen ? 'fixed inset-0 z-50' : 'absolute inset-0 z-10'
      )}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-mvm-blue border-t-transparent" />
        {message && <p className="text-sm font-medium text-gray-700">{message}</p>}
      </div>
    </div>
  )
}
