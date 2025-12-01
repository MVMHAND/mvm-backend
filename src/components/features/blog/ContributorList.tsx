'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { deleteContributorAction } from '@/actions/blog-contributors'
import { formatDateTime } from '@/lib/utils'
import type { BlogContributor } from '@/types'

interface ContributorListProps {
  contributors: BlogContributor[]
}

export function ContributorList({ contributors }: ContributorListProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Filter contributors by search
  const filteredContributors = contributors.filter(
    (contributor) =>
      contributor.full_name.toLowerCase().includes(search.toLowerCase()) ||
      contributor.position.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = (contributorId: string, contributorName: string) => {
    if (!confirm(`Are you sure you want to delete "${contributorName}"?`)) {
      return
    }

    setError(null)
    setDeletingId(contributorId)
    startTransition(async () => {
      const result = await deleteContributorAction(contributorId)

      if (result.success) {
        router.refresh()
      } else {
        setError(result.error || 'Failed to delete contributor')
      }
      setDeletingId(null)
    })
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-800">
          <p>{error}</p>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <Input
          type="search"
          placeholder="Search contributors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
        <Link href="/admin/blog/contributors/new">
          <Button>Create Contributor</Button>
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Contributor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Position
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Expertise
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Posts
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredContributors.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  {search
                    ? 'No contributors found matching your search.'
                    : 'No contributors yet. Create your first one!'}
                </td>
              </tr>
            ) : (
              filteredContributors.map((contributor) => (
                <tr key={contributor.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-3">
                      {contributor.avatar_url ? (
                        <img
                          src={contributor.avatar_url}
                          alt={contributor.full_name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-mvm-blue text-white">
                          {contributor.full_name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900">{contributor.full_name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{contributor.position}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {contributor.expertise.slice(0, 2).map((exp, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800"
                        >
                          {exp}
                        </span>
                      ))}
                      {contributor.expertise.length > 2 && (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                          +{contributor.expertise.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {contributor.post_count} {contributor.post_count === 1 ? 'post' : 'posts'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {formatDateTime(contributor.created_at)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/blog/contributors/${contributor.id}`}>
                        <Button size="sm" variant="outline">
                          Edit
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(contributor.id, contributor.full_name)}
                        disabled={isPending && deletingId === contributor.id}
                      >
                        {isPending && deletingId === contributor.id ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filteredContributors.length > 0 && (
        <div className="text-sm text-gray-500">
          Showing {filteredContributors.length} of {contributors.length} contributors
        </div>
      )}
    </div>
  )
}
