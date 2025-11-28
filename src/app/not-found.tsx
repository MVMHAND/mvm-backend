import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-mvm p-4">
      <div className="text-center text-white">
        <h1 className="mb-4 text-9xl font-bold">404</h1>
        <h2 className="mb-6 text-3xl font-semibold">Page Not Found</h2>
        <p className="mb-8 text-lg opacity-90">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/">
          <Button
            size="lg"
            variant="secondary"
            className="bg-white text-mvm-blue hover:bg-white/90"
          >
            Return Home
          </Button>
        </Link>
      </div>
    </div>
  )
}
