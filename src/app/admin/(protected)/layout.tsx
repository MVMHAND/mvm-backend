import { verifySessionWithProfile, getUserPermissions } from '@/lib/dal'
import { MENU_CONFIG } from '@/config/menu'
import { AdminLayoutClient } from '@/components/layout/AdminLayoutClient'

/**
 * Protected Admin Layout
 *
 * This layout wraps all protected admin routes and ensures:
 * 1. User is authenticated (via verifySessionWithProfile from DAL)
 * 2. User profile and permissions are loaded
 * 3. Data is passed to client components via props
 *
 * SECURITY: Uses DAL for proper JWT validation with getUser()
 */
export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  // SECURITY: verifySessionWithProfile validates JWT with Auth server
  // and redirects to login if not authenticated
  const profile = await verifySessionWithProfile()

  // Get user permissions (memoized via React cache)
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
          name: profile.role.name,
          is_super_admin: profile.role.is_super_admin,
        },
      }}
    >
      {children}
    </AdminLayoutClient>
  )
}
