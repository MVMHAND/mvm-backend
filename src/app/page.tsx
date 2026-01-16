import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/dal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { LoginForm } from '@/components/features/auth/LoginForm'
import { APP_NAME } from '@/lib/constants'

interface HomePageProps {
  searchParams: Promise<{ message?: string; redirect?: string }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams
  const message = params.message
  const redirectTo = params.redirect

  // Check if user is already authenticated - redirect to admin dashboard
  const user = await getCurrentUser()

  if (user) {
    redirect(redirectTo || '/admin')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-mvm p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <span className="text-3xl font-bold text-white">MVM</span>
          </div>
        </div>

        {/* Auth Message */}
        {message && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
            <p className="text-sm text-amber-800">{message}</p>
          </div>
        )}

        {/* Login Card */}
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{APP_NAME}</CardTitle>
            <CardDescription className="text-base">
              Admin Panel - Sign in to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm redirectTo={redirectTo} />
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-white/90">
          Access is invitation-only. Contact your administrator if you need access.
        </p>
      </div>
    </div>
  )
}
