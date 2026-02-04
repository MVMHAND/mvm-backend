'use client'

import { useState, useTransition, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { LoadingOverlay } from '@/components/ui/LoadingOverlay'
import { useToast } from '@/contexts/ToastContext'
import { createJobPostAction, updateJobPostAction } from '@/actions/job-posts'
import type {
  JobPostWithUsers,
  JobPostFormData,
  EmploymentType,
  ExperienceLevel,
} from '@/types/job-posts'
import { RichTextEditor } from '@/components/features/blog/RichTextEditor'
import { AuditInfo } from '@/components/features/shared/AuditInfo'
import { useUser } from '@/store/provider'
import { getJobPostAnalyticsUrl } from '@/lib/analytics/job-analytics'

interface CategoryOption {
  id: string
  name: string
  color?: string | null
}

interface JobPostFormProps {
  post?: JobPostWithUsers
  categories: CategoryOption[]
  isEditing?: boolean
}

export function JobPostForm({ post, categories, isEditing = false }: JobPostFormProps) {
  const router = useRouter()
  const { success, error: showError } = useToast()
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const user = useUser()

  // Form state - responsibilities, must_have_skills, preferred_skills, benefits are HTML from TipTap editor
  const [formData, setFormData] = useState<JobPostFormData>({
    title: post?.title || '',
    overview: post?.overview || '',

    category_id: post?.category_id || '',
    department: post?.department || '',
    location: post?.location || 'Remote - ',
    employment_type: post?.employment_type || 'full-time',

    salary_type: post?.salary_custom_text ? 'custom' : 'structured',
    salary_min: post?.salary_min || undefined,
    salary_max: post?.salary_max || undefined,
    salary_currency: post?.salary_currency || 'AUD',
    salary_period: post?.salary_period || 'hourly',
    salary_custom_text: post?.salary_custom_text || '',

    // HTML content fields (from TipTap editor)
    responsibilities: post?.responsibilities || '',
    must_have_skills: post?.must_have_skills || '',
    preferred_skills: post?.preferred_skills || '',
    benefits: post?.benefits || '',
    // Skills is multi-line text converted to array
    skills: post?.skills?.join('\n') || '',

    experience_level: post?.experience_level || undefined,
    status: post?.status || 'published',
    custom_posted_date: post?.custom_posted_date
      ? new Date(post.custom_posted_date).toISOString().slice(0, 16)
      : '',

    application_email: post?.application_email || user?.email || '',
  })

  const handleSubmit = async (e: FormEvent, statusOverride?: 'draft' | 'published') => {
    e.preventDefault()
    setErrors({})

    const newErrors: Record<string, string> = {}
    if (!formData.title.trim()) newErrors.title = 'Title is required'
    if (!formData.employment_type) newErrors.employment_type = 'Employment type is required'
    if (!formData.overview?.trim()) newErrors.overview = 'Position overview is required'
    if (!formData.location?.trim()) newErrors.location = 'Location is required'

    // Validate application email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.application_email?.trim()) {
      newErrors.application_email = 'Application email is required'
    } else if (!emailRegex.test(formData.application_email)) {
      newErrors.application_email = 'Please enter a valid email address'
    }

    // Additional validation when publishing
    const effectiveStatus = statusOverride || formData.status
    if (effectiveStatus === 'published') {
      if (!formData.category_id) newErrors.category_id = 'Category is required when publishing'
      if (!formData.responsibilities?.trim())
        newErrors.responsibilities = 'Responsibilities are required when publishing'
      if (!formData.must_have_skills?.trim())
        newErrors.must_have_skills = 'Must have skills are required when publishing'
      if (!formData.preferred_skills?.trim())
        newErrors.preferred_skills = 'Preferred skills are required when publishing'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const submitData = { ...formData }
    if (statusOverride) {
      submitData.status = statusOverride
    }

    // Remove salary_type from submit data (it's only for form UI)
    delete submitData.salary_type

    // Clear irrelevant salary fields based on type
    if (formData.salary_type === 'custom') {
      submitData.salary_min = undefined
      submitData.salary_max = undefined
    } else {
      submitData.salary_custom_text = undefined
    }

    startTransition(async () => {
      const result = isEditing
        ? await updateJobPostAction(post!.id, submitData)
        : await createJobPostAction(submitData)

      if (result.success) {
        success(result.message || 'Job post saved successfully')
        router.push('/admin/job-posts/posts')
        router.refresh()
      } else {
        showError(result.error || 'An error occurred')
      }
    })
  }

  return (
    <Card className="relative">
      <LoadingOverlay isLoading={isPending} message="Saving job post..." />
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{isEditing ? 'Edit Job Post' : 'Create New Job Post'}</CardTitle>
          {isEditing && post && (
            <a
              href={getJobPostAnalyticsUrl(post.job_id)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-mvm-blue px-4 py-2 text-sm font-medium text-white hover:bg-mvm-blue/90 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 3v18h18" />
                <path d="m19 9-5 5-4-4-3 3" />
              </svg>
              View Analytics
            </a>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => handleSubmit(e)} className="space-y-8">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>

            <Input
              label="Job Title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Senior Full-Stack Developer"
              required
              error={errors.title}
            />

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Position Overview <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.overview}
                onChange={(e) => setFormData({ ...formData, overview: e.target.value })}
                placeholder="Detailed overview of the position (displayed on website)"
                rows={6}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-mvm-blue focus:outline-none focus:ring-2 focus:ring-mvm-blue focus:ring-opacity-20"
              />
              {errors.overview && <p className="mt-1 text-sm text-red-600">{errors.overview}</p>}
              <p className="mt-1 text-sm text-gray-500">
                This will be shown on the main website. First ~150 characters shown in listings.
              </p>
            </div>
          </div>

          {/* Job Details */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900">Job Details</h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Category <span className="text-xs text-gray-500">(required for publishing)</span>
                </label>
                <select
                  value={formData.category_id || ''}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className={`w-full rounded-lg border px-3 py-2 text-gray-900 focus:border-mvm-blue focus:outline-none focus:ring-2 focus:ring-mvm-blue focus:ring-opacity-20 ${errors.category_id ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {formData.category_id && (
                  <div className="mt-2">
                    <span className="text-xs text-gray-600">Preview: </span>
                    <span
                      className="inline-block rounded-full px-3 py-1 text-sm font-medium text-white"
                      style={{
                        backgroundColor:
                          categories.find((c) => c.id === formData.category_id)?.color || '#6B7280',
                      }}
                    >
                      {categories.find((c) => c.id === formData.category_id)?.name}
                    </span>
                  </div>
                )}
                {errors.category_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.category_id}</p>
                )}
              </div>

              <Input
                label="Department"
                value={formData.department || ''}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="e.g., Engineering, Marketing"
              />

              <div>
                <Input
                  label="Location"
                  value={formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                  error={errors.location}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Examples: "Remote - Global", "Remote - India, Philippines"
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Employment Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.employment_type}
                  onChange={(e) =>
                    setFormData({ ...formData, employment_type: e.target.value as EmploymentType })
                  }
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-mvm-blue focus:outline-none focus:ring-2 focus:ring-mvm-blue focus:ring-opacity-20"
                >
                  <option value="full-time">Full-Time</option>
                  <option value="part-time">Part-Time</option>
                  <option value="contract">Contract</option>
                  <option value="project-based">Project-Based</option>
                  <option value="freelance">Freelance</option>
                  <option value="internship">Internship</option>
                </select>
                {errors.employment_type && (
                  <p className="mt-1 text-sm text-red-600">{errors.employment_type}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Experience Level
                </label>
                <select
                  value={formData.experience_level || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      experience_level: (e.target.value as ExperienceLevel) || undefined,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-mvm-blue focus:outline-none focus:ring-2 focus:ring-mvm-blue focus:ring-opacity-20"
                >
                  <option value="">Select level (optional)</option>
                  <option value="entry-level">Entry Level</option>
                  <option value="junior">Junior</option>
                  <option value="mid-level">Mid-Level</option>
                  <option value="senior">Senior</option>
                  <option value="lead">Lead</option>
                  <option value="principal">Principal</option>
                  <option value="executive">Executive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Salary Information */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900">Salary Information</h3>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">Salary Type</label>
              <div className="flex gap-6">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    value="structured"
                    checked={formData.salary_type === 'structured'}
                    onChange={() => setFormData({ ...formData, salary_type: 'structured' })}
                    className="h-4 w-4 border-gray-300 text-mvm-blue focus:ring-mvm-blue"
                  />
                  <span className="text-sm text-gray-700">Structured Range</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    value="custom"
                    checked={formData.salary_type === 'custom'}
                    onChange={() => setFormData({ ...formData, salary_type: 'custom' })}
                    className="h-4 w-4 border-gray-300 text-mvm-blue focus:ring-mvm-blue"
                  />
                  <span className="text-sm text-gray-700">Custom Text</span>
                </label>
              </div>
            </div>

            {formData.salary_type === 'structured' ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <Input
                  label="Minimum"
                  type="number"
                  value={formData.salary_min || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      salary_min: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  placeholder="80"
                />
                <Input
                  label="Maximum"
                  type="number"
                  value={formData.salary_max || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      salary_max: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  placeholder="120"
                />
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Currency</label>
                  <select
                    value={formData.salary_currency}
                    onChange={(e) => setFormData({ ...formData, salary_currency: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-mvm-blue focus:outline-none focus:ring-2 focus:ring-mvm-blue focus:ring-opacity-20"
                  >
                    <option value="AUD">AUD</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Period</label>
                  <select
                    value={formData.salary_period}
                    onChange={(e) => setFormData({ ...formData, salary_period: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-mvm-blue focus:outline-none focus:ring-2 focus:ring-mvm-blue focus:ring-opacity-20"
                  >
                    <option value="hourly">Per Hour</option>
                    <option value="monthly">Per Month</option>
                    <option value="annually">Per Year</option>
                  </select>
                </div>
              </div>
            ) : (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Custom Salary Description
                </label>
                <textarea
                  value={formData.salary_custom_text}
                  onChange={(e) => setFormData({ ...formData, salary_custom_text: e.target.value })}
                  placeholder="e.g., Competitive salary package with bonuses and benefits"
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-mvm-blue focus:outline-none focus:ring-2 focus:ring-mvm-blue focus:ring-opacity-20"
                />
              </div>
            )}
          </div>

          {/* Responsibilities (Rich Text) */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Responsibilities{' '}
              <span className="text-xs font-normal text-gray-500">(required for publishing)</span>
            </h3>
            <p className="text-sm text-gray-600">
              Use the editor to format responsibilities. Use bullet lists for multiple items.
            </p>
            <RichTextEditor
              value={formData.responsibilities || ''}
              onChange={(value) => setFormData({ ...formData, responsibilities: value })}
            />
            {errors.responsibilities && (
              <p className="mt-1 text-sm text-red-600">{errors.responsibilities}</p>
            )}
          </div>

          {/* Must Have Skills (Rich Text) */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Must Have Skills{' '}
              <span className="text-xs font-normal text-gray-500">(required for publishing)</span>
            </h3>
            <p className="text-sm text-gray-600">
              Use the editor to format required skills. Use bullet lists for multiple items.
            </p>
            <RichTextEditor
              value={formData.must_have_skills || ''}
              onChange={(value) => setFormData({ ...formData, must_have_skills: value })}
            />
            {errors.must_have_skills && (
              <p className="mt-1 text-sm text-red-600">{errors.must_have_skills}</p>
            )}
          </div>

          {/* Preferred Skills (Rich Text) */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Preferred Skills{' '}
              <span className="text-xs font-normal text-gray-500">(required for publishing)</span>
            </h3>
            <p className="text-sm text-gray-600">
              Use the editor to format preferred skills. Use bullet lists for multiple items.
            </p>
            <RichTextEditor
              value={formData.preferred_skills || ''}
              onChange={(value) => setFormData({ ...formData, preferred_skills: value })}
            />
            {errors.preferred_skills && (
              <p className="mt-1 text-sm text-red-600">{errors.preferred_skills}</p>
            )}
          </div>

          {/* Benefits (Rich Text) */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900">Benefits (Optional)</h3>
            <p className="text-sm text-gray-600">
              Use the editor to format benefits. Use bullet lists for multiple items.
            </p>
            <RichTextEditor
              value={formData.benefits || ''}
              onChange={(value) => setFormData({ ...formData, benefits: value })}
            />
          </div>

          {/* Skills/Tags (Multi-line) */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900">Skills/Tags</h3>
            <p className="text-sm text-gray-600">
              Enter one skill/tag per line (displayed as chips on website)
            </p>
            <textarea
              value={formData.skills}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
              placeholder="TypeScript&#10;React&#10;Node.js&#10;PostgreSQL"
              rows={6}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-mvm-blue focus:outline-none focus:ring-2 focus:ring-mvm-blue focus:ring-opacity-20"
            />
          </div>

          {/* Application Information */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900">Application Information</h3>

            <div>
              <Input
                label="Application Email"
                type="email"
                value={formData.application_email || ''}
                onChange={(e) => setFormData({ ...formData, application_email: e.target.value })}
                placeholder="careers@myvirtualmate.com"
                required
                error={errors.application_email}
              />
              <p className="mt-1 text-sm text-gray-500">
                Email address where candidates should send their applications
              </p>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900">Advanced Settings</h3>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Custom Posted Date
              </label>
              <input
                type="datetime-local"
                value={formData.custom_posted_date || ''}
                onChange={(e) => setFormData({ ...formData, custom_posted_date: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-mvm-blue focus:outline-none focus:ring-2 focus:ring-mvm-blue focus:ring-opacity-20"
              />
              <p className="mt-1 text-sm text-gray-500">
                Override the default posted date (optional)
              </p>
            </div>
          </div>

          {/* Audit Information */}
          {isEditing && post && (
            <AuditInfo
              createdBy={post.creator}
              createdAt={post.created_at}
              updatedBy={post.updater}
              updatedAt={post.updated_at}
              publishedBy={post.publisher}
              publishedAt={post.published_at}
              variant="detailed"
            />
          )}

          {/* Actions */}
          <div className="flex items-center justify-between gap-4 border-t pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isPending}
            >
              Cancel
            </Button>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={isPending}
                onClick={(e) => handleSubmit(e, 'draft')}
              >
                {isPending ? 'Saving...' : 'Save as Draft'}
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                onClick={(e) => handleSubmit(e, 'published')}
              >
                {isPending ? 'Saving...' : isEditing ? 'Update & Publish' : 'Publish'}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
