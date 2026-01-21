'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingOverlay } from '@/components/ui/LoadingOverlay'
import { createAllowedDomainAction, updateAllowedDomainAction } from '@/actions/allowed-domains'
import { AuditInfo } from '@/components/features/shared/AuditInfo'
import type { AllowedDomainWithUsers } from '@/types'

interface AllowedDomainFormProps {
  domain?: AllowedDomainWithUsers
  isEditing?: boolean
}

export function AllowedDomainForm({ domain, isEditing = false }: AllowedDomainFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [formDomain, setFormDomain] = useState(domain?.domain || '')
  const [description, setDescription] = useState(domain?.description || '')
  const [isActive, setIsActive] = useState(domain?.is_active ?? true)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formDomain.trim()) {
      setError('Domain is required')
      return
    }

    if (!formDomain.startsWith('http://') && !formDomain.startsWith('https://')) {
      setError('Domain must start with http:// or https://')
      return
    }

    startTransition(async () => {
      const data = {
        domain: formDomain.trim(),
        description: description.trim(),
        is_active: isActive,
      }

      const result =
        isEditing && domain
          ? await updateAllowedDomainAction(domain.id, data)
          : await createAllowedDomainAction(data)

      if (result.success) {
        router.push('/admin/settings/allowed-domains')
        router.refresh()
      } else {
        setError(result.error || 'An error occurred')
      }
    })
  }

  return (
    <Card className="relative">
      <LoadingOverlay isLoading={isPending} message="Saving domain..." />
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Allowed Domain' : 'Add Allowed Domain'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-red-800">
              <p>{error}</p>
            </div>
          )}

          <Input
            label="Domain URL"
            type="text"
            value={formDomain}
            onChange={(e) => setFormDomain(e.target.value)}
            placeholder="https://example.com"
            required
            helperText="Include the full URL with protocol (http:// or https://)"
          />

          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">
              Description <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Production website, Staging environment"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-mvm-blue focus:outline-none focus:ring-2 focus:ring-mvm-blue focus:ring-opacity-20"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-mvm-blue focus:ring-mvm-blue"
            />
            <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-700">
              Active (allow this domain to access the blog API)
            </label>
          </div>

          {isEditing && domain && (
            <AuditInfo
              createdBy={domain.creator}
              createdAt={domain.created_at}
              updatedBy={domain.updater}
              updatedAt={domain.updated_at}
              variant="detailed"
              className="mt-6"
            />
          )}

          <div className="flex gap-4 border-t pt-6">
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Domain'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
