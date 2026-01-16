'use client'

import { Suspense, useState, useEffect, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { verifyInvitationTokenAction, acceptInvitationAction } from '@/actions/invitations'

function AcceptInvitationForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [isVerifying, setIsVerifying] = useState(true)
  const [isValid, setIsValid] = useState(false)
  const [invitationData, setInvitationData] = useState<{
    email: string
    name: string
    roleId: string
  } | null>(null)

  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Verify token on mount
  useEffect(() => {
    async function verifyToken() {
      if (!token) {
        setError('Invalid invitation link')
        setIsVerifying(false)
        return
      }

      const result = await verifyInvitationTokenAction(token)

      if (!result.success) {
        setError(result.error || 'Invalid invitation')
        setIsValid(false)
      } else {
        setInvitationData(result.data || null)
        setIsValid(true)
      }

      setIsVerifying(false)
    }

    verifyToken()
  }, [token])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validate name
    if (!name.trim()) {
      setError('Name is required')
      return
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Validate password strength
    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    if (!token) {
      setError('Invalid invitation link')
      return
    }

    setIsLoading(true)

    try {
      const result = await acceptInvitationAction(token, name.trim(), password)

      if (!result.success) {
        setError(result.error || 'Failed to create account')
        setIsLoading(false)
        return
      }

      setSuccess(result.message || 'Account created successfully!')
      setIsLoading(false)

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/')
      }, 2000)
    } catch {
      setError('An unexpected error occurred')
      setIsLoading(false)
    }
  }

  if (isVerifying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Verifying invitation...</h2>
            <div className="mt-4 flex justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-mvm-blue border-t-transparent"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isValid || !invitationData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-8 w-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">Invalid Invitation</h2>
            <p className="mt-2 text-sm text-gray-600">{error}</p>
            <div className="mt-6">
              <Link href="/" className="text-sm font-medium text-mvm-blue hover:text-mvm-blue/80">
                Return to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Set Up Your Account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Welcome! Complete your account setup by providing your name and creating a password.
          </p>
          <p className="mt-1 text-xs text-gray-500">{invitationData.email}</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4 rounded-md shadow-sm">
            <Input
              label="Full Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              required
              disabled={isLoading}
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={isLoading}
              helperText="Must be at least 8 characters long"
            />

            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
              <p className="font-medium">Error</p>
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800">
              <p className="font-medium">Success</p>
              <p>{success}</p>
              <p className="mt-1">Redirecting to login...</p>
            </div>
          )}

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Create Account
          </Button>

          <div className="text-center text-sm">
            <Link href="/" className="font-medium text-mvm-blue hover:text-mvm-blue/80">
              Already have an account? Log in
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Loading...</h2>
          <div className="mt-4 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-mvm-blue border-t-transparent"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AcceptInvitationForm />
    </Suspense>
  )
}
