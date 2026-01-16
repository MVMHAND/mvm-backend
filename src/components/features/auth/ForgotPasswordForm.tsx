'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { forgotPasswordAction } from '@/actions/auth'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append('email', email)

      const result = await forgotPasswordAction(formData)

      if (!result.success) {
        setError(result.error || 'An error occurred. Please try again.')
        setIsLoading(false)
        return
      }

      setSuccess(true)
      setIsLoading(false)
    } catch {
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800">
          <p className="font-medium">Check your email</p>
          <p className="mt-1">
            If an account with this email exists, we&apos;ve sent you a password reset link. Please
            check your inbox and spam folder.
          </p>
        </div>

        <div className="text-center">
          <Link href="/" className="text-sm text-mvm-blue hover:underline">
            ← Back to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-sm text-gray-600">
        Enter the email address associated with your account and we&apos;ll send you a link to reset
        your password.
      </p>

      <Input
        label="Email Address"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="admin@myvirtualmate.com"
        required
        autoComplete="email"
        disabled={isLoading}
      />

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
          <p className="font-medium">Error</p>
          <p>{error}</p>
        </div>
      )}

      <Button type="submit" className="w-full" isLoading={isLoading}>
        Send Reset Link
      </Button>

      <div className="text-center">
        <Link href="/" className="text-sm text-mvm-blue hover:underline">
          ← Back to login
        </Link>
      </div>
    </form>
  )
}
