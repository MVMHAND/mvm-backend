import { Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { ResetPasswordForm } from '@/components/features/auth/ResetPasswordForm'
import { APP_NAME } from '@/lib/constants'

function FormLoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-8">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-mvm-blue border-t-transparent"></div>
      <p className="text-sm text-gray-600">Loading...</p>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-mvm p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <span className="text-3xl font-bold text-white">MVM</span>
          </div>
        </div>

        {/* Reset Password Card */}
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{APP_NAME}</CardTitle>
            <CardDescription className="text-base">Create your new password</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<FormLoadingFallback />}>
              <ResetPasswordForm />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
