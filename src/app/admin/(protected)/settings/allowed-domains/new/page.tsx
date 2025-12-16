import { AllowedDomainForm } from '@/components/features/settings/AllowedDomainForm'

export const metadata = {
  title: 'Add Allowed Domain | Settings',
  description: 'Add a new domain to the allowed list',
}

export default function NewAllowedDomainPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Add Allowed Domain</h1>
        <p className="mt-2 text-gray-600">Add a new domain that can access the public blog API</p>
      </div>

      <AllowedDomainForm />
    </div>
  )
}
