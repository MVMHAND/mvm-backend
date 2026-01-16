import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/dal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { ForgotPasswordForm } from '@/components/features/auth/ForgotPasswordForm'
import { APP_NAME } from '@/lib/constants'

export const metadata = {
  title: `Forgot Password | ${APP_NAME}`,
  description: 'Reset your password',
}

export default async function ForgotPasswordPage() {
  // Check if user is already authenticated - redirect to admin dashboard
  const user = await getCurrentUser()

  if (user) {
    redirect('/admin')
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

        {/* Forgot Password Card */}
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Forgot Password</CardTitle>
            <CardDescription className="text-base">
              Enter your email to receive a password reset link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ForgotPasswordForm />
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-white/90">
          Remember your password? Go back to login.
        </p>
      </div>
    </div>
  )
}
