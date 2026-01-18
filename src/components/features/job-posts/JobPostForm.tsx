'use client'

import { useState, useTransition, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { LoadingOverlay } from '@/components/ui/LoadingOverlay'
import { useToast } from '@/contexts/ToastContext'
import { createJobPostAction, updateJobPostAction } from '@/actions/job-posts'
import type { JobPost, JobPostFormData, EmploymentType, ExperienceLevel } from '@/types/job-posts'

interface CategoryOption {
  id: string
  name: string
  slug: string
}

interface JobPostFormProps {
  post?: JobPost
  categories: CategoryOption[]
  isEditing?: boolean
  mainSiteUrls?: string[]
  jobPreviewUrl?: string
}

export function JobPostForm({
  post,
  categories,
  isEditing = false,
  mainSiteUrls = [],
  jobPreviewUrl,
}: JobPostFormProps) {
  const router = useRouter()
  const { success, error: showError } = useToast()
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedUrl(url)
      setTimeout(() => setCopiedUrl(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Form state with multi-line strings for array fields
  const [formData, setFormData] = useState<JobPostFormData>({
    title: post?.title || '',
    overview: post?.overview || '',
    cover_image_url: post?.cover_image_url || '',

    category_id: post?.category_id || '',
    department: post?.department || '',
    location: post?.location || '',
    employment_type: post?.employment_type || 'full-time',

    salary_type: post?.salary_custom_text ? 'custom' : 'structured',
    salary_min: post?.salary_min || undefined,
    salary_max: post?.salary_max || undefined,
    salary_currency: post?.salary_currency || 'AUD',
    salary_period: post?.salary_period || 'hourly',
    salary_custom_text: post?.salary_custom_text || '',

    // Convert arrays to multi-line strings
    responsibilities: post?.responsibilities?.join('\n') || '',
    requirements: post?.requirements?.join('\n') || '',
    preferred_skills: post?.preferred_skills?.join('\n') || '',
    benefits: post?.benefits?.join('\n') || '',
    skills: post?.skills?.join('\n') || '',
    application_process: post?.application_process || '',

    experience_level: post?.experience_level || undefined,
    status: post?.status || 'published',
    custom_posted_date: post?.custom_posted_date
      ? new Date(post.custom_posted_date).toISOString().slice(0, 16)
      : '',

    seo_meta_title: post?.seo_meta_title || '',
    seo_meta_description: post?.seo_meta_description || '',
  })

  const handleSubmit = async (e: FormEvent, statusOverride?: 'draft' | 'published') => {
    e.preventDefault()
    setErrors({})

    const newErrors: Record<string, string> = {}
    if (!formData.title.trim()) newErrors.title = 'Title is required'
    if (!formData.employment_type) newErrors.employment_type = 'Employment type is required'
    if (!formData.overview?.trim()) newErrors.overview = 'Position overview is required'
    if (!formData.location?.trim()) newErrors.location = 'Location is required'

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
        <CardTitle>{isEditing ? 'Edit Job Post' : 'Create New Job Post'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => handleSubmit(e)} className="space-y-8">
          {/* Job URL Preview (if editing) */}
          {isEditing && post?.job_id && (
            <Card>
              <CardHeader>
                <CardTitle>Job URLs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Job Preview URL - Always available */}
                {jobPreviewUrl && (
                  <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">Job Preview</span>
                      </div>
                      <a
                        href={jobPreviewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all text-sm text-mvm-blue hover:underline"
                      >
                        {jobPreviewUrl}
                      </a>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(jobPreviewUrl)}
                      className="shrink-0"
                    >
                      {copiedUrl === jobPreviewUrl ? (
                        <span className="flex items-center gap-1">
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Copied
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                          Copy
                        </span>
                      )}
                    </Button>
                  </div>
                )}

                {/* Main Site URLs - Only for published posts */}
                {post.status === 'published' && mainSiteUrls.length > 0 && (
                  <>
                    <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">
                            Primary Site URL
                          </span>
                          <span className="text-xs text-gray-500">(main production URL)</span>
                        </div>
                        <a
                          href={`${mainSiteUrls[0]}/careers/${post.job_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="break-all text-sm text-mvm-blue hover:underline"
                        >
                          {`${mainSiteUrls[0]}/careers/${post.job_id}`}
                        </a>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(`${mainSiteUrls[0]}/careers/${post.job_id}`)}
                        className="shrink-0"
                      >
                        {copiedUrl === `${mainSiteUrls[0]}/careers/${post.job_id}` ? (
                          <span className="flex items-center gap-1">
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            Copied
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                            Copy
                          </span>
                        )}
                      </Button>
                    </div>

                    {mainSiteUrls.slice(1).map((siteUrl, index) => {
                      const alternateUrl = `${siteUrl}/careers/${post.job_id}`
                      return (
                        <div
                          key={siteUrl}
                          className="flex items-start gap-3 rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-700">
                                Alternate Site URL {index + 1}
                              </span>
                              <span className="text-xs text-gray-500">(alternate domain)</span>
                            </div>
                            <a
                              href={alternateUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="break-all text-sm text-mvm-blue hover:underline"
                            >
                              {alternateUrl}
                            </a>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(alternateUrl)}
                            className="shrink-0"
                          >
                            {copiedUrl === alternateUrl ? (
                              <span className="flex items-center gap-1">
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                                Copied
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                  />
                                </svg>
                                Copy
                              </span>
                            )}
                          </Button>
                        </div>
                      )
                    })}
                  </>
                )}

                {post.status !== 'published' && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="text-sm text-amber-800">
                      <strong>Note:</strong> Production URLs will be available once this job post is
                      published.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

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
                <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
                <select
                  value={formData.category_id || ''}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-mvm-blue focus:outline-none focus:ring-2 focus:ring-mvm-blue focus:ring-opacity-20"
                >
                  <option value="">Select category (optional)</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
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
                  placeholder="e.g., Remote, Sydney, New York"
                  required
                  error={errors.location}
                />
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

          {/* Responsibilities (Multi-line) */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900">Responsibilities</h3>
            <p className="text-sm text-gray-600">Enter one responsibility per line</p>
            <textarea
              value={formData.responsibilities}
              onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
              placeholder="Lead development of new features&#10;Conduct code reviews&#10;Mentor junior developers"
              rows={8}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-mvm-blue focus:outline-none focus:ring-2 focus:ring-mvm-blue focus:ring-opacity-20"
            />
          </div>

          {/* Requirements (Multi-line) */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900">Requirements</h3>
            <p className="text-sm text-gray-600">Enter one requirement per line</p>
            <textarea
              value={formData.requirements}
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              placeholder="5+ years experience in software development&#10;Expert knowledge of TypeScript&#10;Experience with React and Node.js"
              rows={8}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-mvm-blue focus:outline-none focus:ring-2 focus:ring-mvm-blue focus:ring-opacity-20"
            />
          </div>

          {/* Preferred Skills (Multi-line) */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900">Preferred Skills (Optional)</h3>
            <p className="text-sm text-gray-600">Enter one skill per line</p>
            <textarea
              value={formData.preferred_skills}
              onChange={(e) => setFormData({ ...formData, preferred_skills: e.target.value })}
              placeholder="AWS/GCP experience&#10;GraphQL knowledge&#10;Technical leadership experience"
              rows={6}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-mvm-blue focus:outline-none focus:ring-2 focus:ring-mvm-blue focus:ring-opacity-20"
            />
          </div>

          {/* Benefits (Multi-line) */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900">Benefits (Optional)</h3>
            <p className="text-sm text-gray-600">Enter one benefit per line</p>
            <textarea
              value={formData.benefits}
              onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
              placeholder="Competitive salary package&#10;Flexible working hours&#10;Professional development budget"
              rows={6}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-mvm-blue focus:outline-none focus:ring-2 focus:ring-mvm-blue focus:ring-opacity-20"
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

          {/* SEO Settings */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900">SEO Settings</h3>
            <p className="text-sm text-gray-600">Leave empty to auto-generate from job details</p>

            <div>
              <Input
                label="Meta Title"
                value={formData.seo_meta_title || ''}
                onChange={(e) => setFormData({ ...formData, seo_meta_title: e.target.value })}
                maxLength={60}
                placeholder="SEO-optimized title"
              />
              <p className="mt-1 text-sm text-gray-500">
                {formData.seo_meta_title?.length || 0}/60 characters
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Meta Description
              </label>
              <textarea
                value={formData.seo_meta_description || ''}
                onChange={(e) => setFormData({ ...formData, seo_meta_description: e.target.value })}
                maxLength={160}
                rows={3}
                placeholder="SEO-optimized description"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-mvm-blue focus:outline-none focus:ring-2 focus:ring-mvm-blue focus:ring-opacity-20"
              />
              <p className="mt-1 text-sm text-gray-500">
                {formData.seo_meta_description?.length || 0}/160 characters
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
