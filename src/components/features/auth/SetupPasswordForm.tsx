'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { activateUserAfterSetupAction } from '@/actions/users'

export function SetupPasswordForm() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    // Validate passwords
    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()

      // Update the user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        setError(updateError.message)
        setIsLoading(false)
        return
      }

      // Activate the user (change status from 'invited' to 'active')
      const activateResult = await activateUserAfterSetupAction()

      if (!activateResult.success) {
        setError(activateResult.error || 'Failed to activate account')
        setIsLoading(false)
        return
      }

      // Redirect to admin dashboard
      router.push('/admin')
      router.refresh()
    } catch {
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter your password"
        required
        autoComplete="new-password"
        disabled={isLoading}
        helperText="Must be at least 8 characters long"
      />

      <Input
        label="Confirm Password"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Confirm your password"
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
        Complete Setup
      </Button>

      <div className="text-center text-sm text-gray-600">
        <p>Your account will be ready to use after setting up your password.</p>
      </div>
    </form>
  )
}
