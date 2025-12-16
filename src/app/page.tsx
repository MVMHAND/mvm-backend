import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { APP_NAME, APP_TAGLINE, APP_DESCRIPTION } from '@/lib/constants'

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-mvm p-4">
      <div className="w-full max-w-4xl text-center text-white">
        {/* Logo Placeholder */}
        <div className="mb-8 flex justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <span className="text-4xl font-bold text-white">MVM</span>
          </div>
        </div>

        {/* Heading */}
        <h1 className="mb-4 text-5xl font-bold tracking-tight md:text-6xl lg:text-7xl">
          {APP_NAME}
        </h1>

        {/* Tagline */}
        <p className="mb-6 text-xl font-medium md:text-2xl">{APP_TAGLINE}</p>

        {/* Description */}
        <p className="mx-auto mb-12 max-w-2xl text-lg opacity-90 md:text-xl">{APP_DESCRIPTION}</p>

        {/* CTA Buttons */}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="https://myvirtualmate.com">
            <Button
              size="lg"
              variant="secondary"
              className="min-w-48 bg-white text-mvm-blue hover:bg-white/90"
            >
              Learn More
            </Button>
          </Link>
          <Link href="/admin/login">
            <Button
              size="lg"
              variant="outline"
              className="min-w-48 border-white text-white hover:bg-white hover:text-mvm-blue"
            >
              Admin Login
            </Button>
          </Link>
        </div>

        {/* Footer Text */}
        <p className="mt-16 text-sm opacity-75">
          © {new Date().getFullYear()} My Virtual Mate. All rights reserved.
        </p>
      </div>
    </main>
  )
}
