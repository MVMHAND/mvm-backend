'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { LoadingOverlay } from '@/components/ui/LoadingOverlay'
import { ImageUploader } from './ImageUploader'
import {
  createContributorAction,
  updateContributorAction,
  uploadContributorAvatarAction,
} from '@/actions/blog-contributors'
import { AuditInfo } from '@/components/features/shared/AuditInfo'
import type { BlogContributorWithUsers } from '@/types'

interface ContributorFormProps {
  contributor?: BlogContributorWithUsers
  isEditing?: boolean
}

export function ContributorForm({ contributor, isEditing = false }: ContributorFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(contributor?.avatar_url || null)
  const [expertise, setExpertise] = useState<string[]>(
    contributor?.expertise && contributor.expertise.length > 0 ? contributor.expertise : ['']
  )
  const [stats, setStats] = useState<string[]>(
    contributor?.stats && contributor.stats.length > 0 ? contributor.stats : ['']
  )

  // Store pending avatar file for new contributors
  const pendingAvatarFileRef = useRef<File | null>(null)

  const handleAvatarUpload = async (file: File) => {
    // For new contributors, store file and show local preview
    if (!contributor?.id) {
      pendingAvatarFileRef.current = file
      // Create local preview URL
      const previewUrl = URL.createObjectURL(file)
      setAvatarUrl(previewUrl)
      return { success: true, url: previewUrl }
    }

    // For existing contributors, upload immediately
    const formData = new FormData()
    formData.append('avatar', file)
    const result = await uploadContributorAvatarAction(contributor.id, formData)

    if (result.success && result.data) {
      setAvatarUrl(result.data)
    }

    return result
  }

  const handleSubmit = (formData: FormData) => {
    setError(null)

    // Validate expertise and stats
    const filteredExpertise = expertise.filter((e) => e.trim() !== '')
    const filteredStats = stats.filter((s) => s.trim() !== '')

    if (filteredExpertise.length === 0) {
      setError('Please add at least one expertise area')
      return
    }

    if (filteredExpertise.length > 3) {
      setError('Maximum 3 expertise areas allowed')
      return
    }

    if (filteredStats.length === 0) {
      setError('Please add at least one stat')
      return
    }

    if (filteredStats.length > 3) {
      setError('Maximum 3 stats allowed')
      return
    }

    startTransition(async () => {
      const data = {
        full_name: formData.get('full_name') as string,
        position: formData.get('position') as string,
        bio: formData.get('bio') as string,
        avatar_url: isEditing ? avatarUrl : null, // Will be updated after upload for new contributors
        expertise: filteredExpertise,
        stats: filteredStats,
      }

      let result
      if (isEditing && contributor) {
        result = await updateContributorAction(contributor.id, data)
      } else {
        result = await createContributorAction(data)

        // If contributor created successfully and we have a pending avatar file, upload it
        if (result.success && result.data && pendingAvatarFileRef.current) {
          const avatarFormData = new FormData()
          avatarFormData.append('avatar', pendingAvatarFileRef.current)
          await uploadContributorAvatarAction(result.data.id, avatarFormData)
          pendingAvatarFileRef.current = null
        }
      }

      if (result.success) {
        router.push('/admin/blog/contributors')
        router.refresh()
      } else {
        setError(result.error || 'An error occurred')
      }
    })
  }

  // Expertise management
  const addExpertise = () => {
    if (expertise.length < 3) {
      setExpertise([...expertise, ''])
    }
  }

  const removeExpertise = (index: number) => {
    if (expertise.length > 1) {
      setExpertise(expertise.filter((_, i) => i !== index))
    }
  }

  const updateExpertise = (index: number, value: string) => {
    const newExpertise = [...expertise]
    newExpertise[index] = value
    setExpertise(newExpertise)
  }

  // Stats management
  const addStat = () => {
    if (stats.length < 3) {
      setStats([...stats, ''])
    }
  }

  const removeStat = (index: number) => {
    if (stats.length > 1) {
      setStats(stats.filter((_, i) => i !== index))
    }
  }

  const updateStat = (index: number, value: string) => {
    const newStats = [...stats]
    newStats[index] = value
    setStats(newStats)
  }

  return (
    <Card className="relative">
      <LoadingOverlay isLoading={isPending} message={isEditing ? 'Saving...' : 'Creating...'} />
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Contributor' : 'Create New Contributor'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-red-800">
              <p>{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Input
              label="Full Name"
              name="full_name"
              type="text"
              defaultValue={contributor?.full_name || ''}
              placeholder="John Doe"
              required
            />

            <Input
              label="Position"
              name="position"
              type="text"
              defaultValue={contributor?.position || ''}
              placeholder="Senior Marketing Strategist"
              required
            />
          </div>

          {/* Avatar with circle preview */}
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <div className="flex-shrink-0">
              <div className="relative">
                {avatarUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={avatarUrl}
                    alt="Avatar preview"
                    className="h-32 w-32 rounded-full border-4 border-mvm-blue/20 object-cover"
                  />
                ) : (
                  <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-dashed border-gray-300 bg-gray-200">
                    <span className="px-2 text-center text-sm text-gray-400">No avatar</span>
                  </div>
                )}
              </div>
            </div>
            <div className="w-full flex-1">
              <ImageUploader
                label="Avatar (required)"
                onUpload={handleAvatarUpload}
                currentUrl={avatarUrl}
                maxSizeMB={2}
                hidePreview
              />
              <p className="mt-2 text-xs text-gray-500">
                Upload a square image for best results. The avatar will be displayed in a circle.
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="bio" className="mb-1 block text-sm font-medium text-gray-700">
              Bio <span className="text-red-500">*</span>
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={4}
              defaultValue={contributor?.bio || ''}
              placeholder="Tell us about this contributor..."
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-mvm-blue focus:outline-none focus:ring-2 focus:ring-mvm-blue focus:ring-opacity-20"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Expertise Areas <span className="text-red-500">*</span>{' '}
              <span className="text-xs text-gray-500">(1-3 items)</span>
            </label>
            <div className="space-y-2">
              {expertise.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateExpertise(index, e.target.value)}
                    placeholder="e.g., SEO, Content Marketing"
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-mvm-blue focus:outline-none focus:ring-2 focus:ring-mvm-blue focus:ring-opacity-20"
                  />
                  {expertise.length > 1 && (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => removeExpertise(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              {expertise.length < 3 && (
                <Button type="button" variant="outline" size="sm" onClick={addExpertise}>
                  + Add Expertise
                </Button>
              )}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Stats <span className="text-red-500">*</span>{' '}
              <span className="text-xs text-gray-500">
                (1-3 items, e.g., "5+ Years Experience")
              </span>
            </label>
            <div className="space-y-2">
              {stats.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateStat(index, e.target.value)}
                    placeholder="e.g., 5+ Years Experience"
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-mvm-blue focus:outline-none focus:ring-2 focus:ring-mvm-blue focus:ring-opacity-20"
                  />
                  {stats.length > 1 && (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => removeStat(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              {stats.length < 3 && (
                <Button type="button" variant="outline" size="sm" onClick={addStat}>
                  + Add Stat
                </Button>
              )}
            </div>
          </div>

          {isEditing && contributor && (
            <AuditInfo
              createdBy={contributor.creator}
              createdAt={contributor.created_at}
              updatedBy={contributor.updater}
              updatedAt={contributor.updated_at}
              variant="detailed"
              className="mt-6"
            />
          )}

          <div className="flex gap-4 pt-6">
            <Button type="submit" disabled={isPending}>
              {isPending
                ? isEditing
                  ? 'Saving...'
                  : 'Creating...'
                : isEditing
                  ? 'Save Changes'
                  : 'Create Contributor'}
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
