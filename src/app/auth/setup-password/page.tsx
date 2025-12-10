import { verifySession } from '@/lib/dal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { SetupPasswordForm } from '@/components/features/auth/SetupPasswordForm'

export const metadata = {
  title: 'Set Up Password | My Virtual Mate',
  description: 'Complete your account setup',
}

export default async function SetupPasswordPage() {
  // SECURITY: Validate authentication with DAL
  const user = await verifySession()

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-mvm p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <span className="text-3xl font-bold text-white">MVM</span>
          </div>
        </div>

        {/* Setup Card */}
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome to My Virtual Mate!</CardTitle>
            <CardDescription className="text-base">
              Complete your account setup by creating a password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
              <p>
                <strong>Welcome, {user.email}!</strong>
              </p>
              <p className="mt-1">Please create a secure password for your account.</p>
            </div>
            <SetupPasswordForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
