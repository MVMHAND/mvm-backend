import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { ForgotPasswordForm } from '@/components/features/auth/ForgotPasswordForm'
import { APP_NAME } from '@/lib/constants'
import Link from 'next/link'

export default function ForgotPasswordPage() {
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
            <CardTitle className="text-2xl">{APP_NAME}</CardTitle>
            <CardDescription className="text-base">
              Enter your email to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ForgotPasswordForm />
          </CardContent>
        </Card>

        {/* Back to login */}
        <p className="mt-6 text-center text-sm text-white/90">
          <Link href="/admin/login" className="underline hover:text-white">
            ← Back to login
          </Link>
        </p>
      </div>
    </div>
  )
}
