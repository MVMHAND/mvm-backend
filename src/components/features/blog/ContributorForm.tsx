'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ImageUploader } from './ImageUploader'
import {
  createContributorAction,
  updateContributorAction,
  uploadContributorAvatarAction,
} from '@/actions/blog-contributors'
import type { BlogContributor } from '@/types'

interface ContributorFormProps {
  contributor?: BlogContributor
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

  const handleAvatarUpload = async (file: File) => {
    const formData = new FormData()
    formData.append('avatar', file)

    // For new contributors, we'll need to save the file temporarily
    // or handle it after creation
    if (contributor?.id) {
      const result = await uploadContributorAvatarAction(contributor.id, formData)

      if (result.success && result.data) {
        setAvatarUrl(result.data)
      }

      return result
    }

    // For new contributors, just show preview and save file for later
    return { success: true }
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

    if (filteredStats.length > 3) {
      setError('Maximum 3 stats allowed')
      return
    }

    startTransition(async () => {
      const data = {
        full_name: formData.get('full_name') as string,
        position: formData.get('position') as string,
        bio: formData.get('bio') as string,
        avatar_url: avatarUrl,
        expertise: filteredExpertise,
        stats: filteredStats,
      }

      const result =
        isEditing && contributor
          ? await updateContributorAction(contributor.id, data)
          : await createContributorAction(data)

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
    setStats(stats.filter((_, i) => i !== index))
  }

  const updateStat = (index: number, value: string) => {
    const newStats = [...stats]
    newStats[index] = value
    setStats(newStats)
  }

  return (
    <Card>
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

          <ImageUploader
            label="Avatar (optional)"
            onUpload={handleAvatarUpload}
            currentUrl={avatarUrl}
            maxSizeMB={2}
          />

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
              Stats (optional){' '}
              <span className="text-xs text-gray-500">(max 3 items, e.g., "5+ Years Experience")</span>
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
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => removeStat(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              {stats.length < 3 && (
                <Button type="button" variant="outline" size="sm" onClick={addStat}>
                  + Add Stat
                </Button>
              )}
            </div>
          </div>

          <div className="flex gap-4">
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
