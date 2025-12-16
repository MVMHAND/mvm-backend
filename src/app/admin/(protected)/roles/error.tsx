'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

interface RolesErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function RolesError({ error, reset }: RolesErrorProps) {
  useEffect(() => {
    console.error('Roles error:', error)
  }, [error])

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Something went wrong</h2>
        <p className="mt-2 text-gray-600">We encountered an error while loading the roles page.</p>
        <div className="mt-6 flex justify-center gap-4">
          <Button onClick={reset}>Try again</Button>
          <Link href="/admin">
            <Button variant="outline">Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
