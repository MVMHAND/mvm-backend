import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Login | My Virtual Mate',
  description: 'Sign in to access the admin panel',
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
