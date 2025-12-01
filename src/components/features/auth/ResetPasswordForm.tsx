'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { verifyResetTokenAction, resetPasswordAction } from '@/actions/auth'

export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const [isValidToken, setIsValidToken] = useState(false)
  const [userData, setUserData] = useState<{ email: string; userName: string } | null>(null)

  useEffect(() => {
    // Verify the reset token
    const verifyToken = async () => {
      if (!token) {
        setError('Invalid reset link. No token provided.')
        setIsVerifying(false)
        return
      }

      const result = await verifyResetTokenAction(token)

      if (!result.success) {
        setError(result.error || 'Invalid or expired reset link.')
        setIsValidToken(false)
      } else {
        setUserData(result.data || null)
        setIsValidToken(true)
      }

      setIsVerifying(false)
    }

    verifyToken()
  }, [token])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    // Validate password strength
    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      setIsLoading(false)
      return
    }

    if (!token) {
      setError('Invalid reset link')
      setIsLoading(false)
      return
    }

    try {
      const result = await resetPasswordAction(token, password)

      if (!result.success) {
        setError(result.error || 'Failed to reset password')
        setIsLoading(false)
        return
      }

      setSuccess(true)
      setIsLoading(false)

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/admin/login')
      }, 3000)
    } catch {
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  // Loading state while verifying token
  if (isVerifying) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-mvm-blue border-t-transparent"></div>
        <p className="text-sm text-gray-600">Verifying reset link...</p>
      </div>
    )
  }

  // Invalid or expired token
  if (!isValidToken) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
          <p className="font-medium">Invalid or Expired Link</p>
          <p className="mt-1">{error || 'This password reset link is invalid or has expired.'}</p>
        </div>

        <div className="text-center">
          <Link
            href="/admin/forgot-password"
            className="text-sm text-mvm-blue hover:underline"
          >
            Request a new reset link
          </Link>
        </div>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800">
          <p className="font-medium">Password Reset Successful!</p>
          <p className="mt-1">
            Your password has been updated. Redirecting you to the login page...
          </p>
        </div>

        <div className="text-center">
          <Link
            href="/admin/login"
            className="text-sm text-mvm-blue hover:underline"
          >
            Go to login now
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {userData && (
        <p className="text-sm text-gray-600">
          Hi <strong>{userData.userName}</strong>, enter your new password below.
          Make sure it&apos;s at least 8 characters long.
        </p>
      )}

      <Input
        label="New Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter new password"
        required
        autoComplete="new-password"
        disabled={isLoading}
      />

      <Input
        label="Confirm Password"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Confirm new password"
        required
        autoComplete="new-password"
        disabled={isLoading}
      />

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
          <p className="font-medium">Error</p>
          <p>{error}</p>
        </div>
      )}

      <Button type="submit" className="w-full" isLoading={isLoading}>
        Reset Password
      </Button>
    </form>
  )
}
