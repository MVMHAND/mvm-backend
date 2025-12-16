import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Forgot Password | My Virtual Mate',
  description: 'Reset your password',
}

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children
}
