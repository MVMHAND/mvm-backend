import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserPermissions } from '@/lib/permissions'
import { MENU_CONFIG } from '@/config/menu'
import { AdminLayoutClient } from '@/components/layout/AdminLayoutClient'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If not authenticated, render without navigation (for login page)
  if (!user) {
    return <>{children}</>
  }

  // Get user profile with role
  const { data: profile } = await supabase
    .from('profiles')
    .select(
      `
      id,
      name,
      email,
      avatar_url,
      role:roles (
        name,
        is_super_admin
      )
    `
    )
    .eq('id', user.id)
    .single()

  if (!profile || !profile.role) {
    redirect('/admin/login')
  }

  // Get user permissions
  const userPermissions = await getUserPermissions()

  return (
    <AdminLayoutClient
      menuItems={MENU_CONFIG}
      userPermissions={userPermissions}
      user={{
        id: profile.id,
        name: profile.name,
        email: profile.email,
        avatar_url: profile.avatar_url,
        role: {
          name: (profile.role as unknown as { name: string }).name,
          is_super_admin: (profile.role as unknown as { is_super_admin: boolean }).is_super_admin,
        },
      }}
    >
      {children}
    </AdminLayoutClient>
  )
}
