'use client'

import { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Login page error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-mvm p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Something went wrong!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-red-50 p-4">
              <p className="text-sm text-red-800">
                <strong>Error:</strong> {error.message}
              </p>
              {error.digest && (
                <p className="mt-2 text-xs text-red-600">Digest: {error.digest}</p>
              )}
            </div>
            <Button onClick={reset} className="w-full">
              Try again
            </Button>
            <Button
              variant="outline"
              onClick={() => (window.location.href = '/')}
              className="w-full"
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
