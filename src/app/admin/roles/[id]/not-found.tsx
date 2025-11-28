import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function RoleNotFound() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Role Not Found</h2>
        <p className="mt-2 text-gray-600">
          The role you are looking for does not exist or has been deleted.
        </p>
        <div className="mt-6">
          <Link href="/admin/roles">
            <Button>Back to Roles</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
