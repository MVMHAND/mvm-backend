import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getRolesAction } from '@/actions/roles'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { InviteUserForm } from '@/components/features/users/InviteUserForm'

export const metadata = {
  title: 'Invite User | My Virtual Mate',
  description: 'Invite a new admin user',
}

export default async function InviteUserPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect to login if not authenticated
  if (!user) {
    redirect('/admin/login')
  }

  // Get roles for the form
  const result = await getRolesAction()

  if (!result.success) {
    return (
      <div className="p-8">
        <div className="rounded-lg bg-red-50 p-4 text-red-800">
          <p className="font-medium">Error</p>
          <p>{result.error}</p>
        </div>
      </div>
    )
  }

  const roles = result.data!

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link href="/admin/users" className="text-sm text-mvm-blue hover:underline">
          ← Back to Users
        </Link>
      </div>

      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Invite New User</CardTitle>
            <CardDescription>
              Send an invitation email to a new admin user. They will receive an email with
              instructions to set their password and access the admin panel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InviteUserForm roles={roles} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
