import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export const metadata = {
  title: 'Authentication Error | My Virtual Mate',
  description: 'Authentication error',
}

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-mvm p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <span className="text-3xl font-bold text-white">MVM</span>
          </div>
        </div>

        {/* Error Card */}
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-red-600">Authentication Error</CardTitle>
            <CardDescription className="text-base">
              There was a problem with your authentication link
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
              <p className="font-medium">Possible reasons:</p>
              <ul className="ml-4 mt-2 list-disc space-y-1">
                <li>The link has expired</li>
                <li>The link has already been used</li>
                <li>The link is invalid or corrupted</li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                If you were trying to set up your account, please contact your administrator to
                resend the invitation.
              </p>
            </div>

            <Link href="/">
              <Button className="w-full">Go to Login</Button>
            </Link>

            <Link href="/">
              <Button variant="outline" className="w-full">
                Go to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
