'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { loginAction } from '@/actions/auth'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append('email', email)
      formData.append('password', password)

      const result = await loginAction(formData)

      if (!result.success) {
        setError(result.error || 'Login failed. Please try again.')
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
        label="Email Address"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="admin@myvirtualmate.com"
        required
        autoComplete="email"
        disabled={isLoading}
      />

      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter your password"
        required
        autoComplete="current-password"
        disabled={isLoading}
      />

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
          <p className="font-medium">Error</p>
          <p>{error}</p>
        </div>
      )}

      <Button type="submit" className="w-full" isLoading={isLoading}>
        Sign In
      </Button>

      <div className="text-center">
        <a
          href="#"
          className="text-sm text-mvm-blue hover:underline"
          onClick={(e) => {
            e.preventDefault()
            alert('Password reset functionality will be implemented in a future phase.')
          }}
        >
          Forgot your password?
        </a>
      </div>
    </form>
  )
}
