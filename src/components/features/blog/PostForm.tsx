'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { LoadingOverlay } from '@/components/ui/LoadingOverlay'
import { ImageUploader } from './ImageUploader'
import { RichTextEditor } from './RichTextEditor'
import { StatusBadge } from './StatusBadge'
import {
  createPostAction,
  updatePostAction,
  uploadPostCoverAction,
  checkSlugExistsAction,
} from '@/actions/blog-posts'
import { slugify } from '@/lib/utils'
import type { BlogPostWithRelations, ContentType, AdditionalSchema } from '@/types'
import JsonLdSchemaEditor from './JsonLdSchemaEditor'
import { AuditInfo } from '@/components/features/shared/AuditInfo'

interface CategoryOption {
  id: string
  name: string
}

interface ContributorOption {
  id: string
  full_name: string
}

interface PostFormProps {
  post?: BlogPostWithRelations
  categories: CategoryOption[]
  contributors: ContributorOption[]
  isEditing?: boolean
}

export function PostForm({ post, categories, contributors, isEditing = false }: PostFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState(post?.title || '')
  const [description, setDescription] = useState(post?.description || '')
  const [seoTitle, setSeoTitle] = useState(post?.seo_meta_title || '')
  const [seoDescription, setSeoDescription] = useState(post?.seo_meta_description || '')
  const [seoKeywords, setSeoKeywords] = useState(post?.seo_keywords || '')
  const [slug, setSlug] = useState(post?.slug || '')
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(post?.cover_image_url || null)
  const [categoryId, setCategoryId] = useState(post?.category_id || '')
  const [contributorId, setContributorId] = useState(post?.contributor_id || '')
  const [content, setContent] = useState(post?.content || '')
  const [contentType, setContentType] = useState<ContentType>(post?.content_type || 'tiptap')

  // Published date state (format for datetime-local input)
  const [publishedDate, setPublishedDate] = useState<string>(
    post?.published_date ? new Date(post.published_date).toISOString().slice(0, 16) : ''
  )

  // Additional schemas state
  const [additionalSchemas, setAdditionalSchemas] = useState<AdditionalSchema[]>(
    post?.seo_additional_schemas
      ? post.seo_additional_schemas.map(
          (data, index) =>
            ({
              id: `schema-${index}`,
              type: ((data as Record<string, unknown>)['@type'] as string) || 'Custom',
              data: data as Record<string, unknown>,
            }) as AdditionalSchema
        )
      : []
  )

  // Track if slug was manually edited
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(isEditing)

  // Store pending cover file for new and existing posts
  const pendingCoverFileRef = useRef<File | null>(null)
  // Track if cover image has changed for existing posts
  const [coverImageChanged, setCoverImageChanged] = useState(false)

  // Auto-generate slug from title only if not manually edited
  useEffect(() => {
    if (!slugManuallyEdited && title) {
      setSlug(slugify(title))
    }
  }, [title, slugManuallyEdited])

  // Handle slug input - allow hyphens while typing
  const handleSlugChange = (value: string) => {
    setSlugManuallyEdited(true)
    // Only allow lowercase letters, numbers, and hyphens
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setSlug(sanitized)
  }

  // Calculate reading time (200 words per minute)
  const calculateReadingTime = (htmlContent: string): number => {
    const text = htmlContent.replace(/<[^>]*>/g, '')
    const wordCount = text.trim().split(/\s+/).length
    return Math.max(1, Math.ceil(wordCount / 200))
  }

  const handleCoverUpload = async (file: File) => {
    // Store the file and show preview for both new and existing posts
    pendingCoverFileRef.current = file

    // Create local preview URL
    const previewUrl = URL.createObjectURL(file)
    setCoverImageUrl(previewUrl)

    // Mark that cover image has changed for existing posts
    if (post?.id) {
      setCoverImageChanged(true)
    }

    return { success: true, url: previewUrl }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Determine if saving as draft (new posts default to draft)
    const isDraft = !isEditing || post?.status === 'draft'

    // Basic validation - always required
    if (!title.trim()) {
      setError('Title is required')
      return
    }

    if (!slug.trim()) {
      setError('Slug is required')
      return
    }

    // Check for duplicate slug before saving
    const slugCheckResult = await checkSlugExistsAction(slug.trim(), post?.id)
    if (slugCheckResult.exists) {
      setError('This slug is already in use. Please choose a different slug.')
      return
    }

    // For non-draft posts (publishing), require all fields
    if (!isDraft && post?.status !== 'draft') {
      if (!description.trim()) {
        setError('Description is required for publishing')
        return
      }

      if (!seoTitle.trim()) {
        setError('SEO meta title is required')
        return
      }

      if (seoTitle.length > 60) {
        setError('SEO meta title must be 60 characters or less')
        return
      }

      if (!seoDescription.trim()) {
        setError('SEO meta description is required')
        return
      }

      if (seoDescription.length > 160) {
        setError('SEO meta description must be 160 characters or less')
        return
      }

      if (!categoryId) {
        setError('Please select a category')
        return
      }

      if (!contributorId) {
        setError('Please select a contributor')
        return
      }

      if (!content.trim() || content === '<p><br></p>') {
        setError('Content is required')
        return
      }

      if (!coverImageUrl) {
        setError('Cover image is required')
        return
      }
    }

    // Validate all additional schemas
    const hasSchemaErrors = additionalSchemas.some((schema) => {
      try {
        JSON.stringify(schema.data)
        return false
      } catch {
        return true
      }
    })

    if (hasSchemaErrors) {
      setError('Please fix schema validation errors before saving')
      return
    }

    // Convert datetime-local to ISO timestamp
    const publishedDateISO = publishedDate ? new Date(publishedDate).toISOString() : null

    startTransition(async () => {
      const readingTime = content ? calculateReadingTime(content) : 1

      const data = {
        title: title.trim(),
        description: description.trim() || '',
        // For drafts, leave SEO fields empty if not provided (don't auto-fill from title)
        seo_meta_title: seoTitle.trim() || '',
        seo_meta_description: seoDescription.trim() || '',
        seo_keywords: seoKeywords.trim() || '',
        slug: slug.trim(),
        cover_image_url: isEditing ? coverImageUrl : null, // Will be updated after upload for new posts
        category_id: categoryId || null,
        contributor_id: contributorId || null,
        content: content || '',
        content_type: contentType,
        reading_time: readingTime,
        status: (post?.status || 'draft') as 'draft' | 'published' | 'unpublished',
        published_date: publishedDateISO,
        seo_additional_schemas: JSON.stringify(additionalSchemas.map((s) => s.data)),
      }

      let result
      if (isEditing && post) {
        result = await updatePostAction(post.id, data)

        // If post updated successfully and cover image changed, upload it
        if (result.success && coverImageChanged && pendingCoverFileRef.current) {
          const formData = new FormData()
          formData.append('cover', pendingCoverFileRef.current)
          await uploadPostCoverAction(post.id, formData)
          pendingCoverFileRef.current = null
          setCoverImageChanged(false)
        }
      } else {
        result = await createPostAction(data)

        // If post created successfully and we have a pending cover file, upload it
        if (result.success && result.data && pendingCoverFileRef.current) {
          const formData = new FormData()
          formData.append('cover', pendingCoverFileRef.current)
          await uploadPostCoverAction(result.data.id, formData)
          pendingCoverFileRef.current = null
        }
      }

      if (result.success) {
        router.push('/admin/blog/posts')
        router.refresh()
      } else {
        setError(result.error || 'An error occurred')
      }
    })
  }

  return (
    <Card className="relative">
      <LoadingOverlay isLoading={isPending} message="Saving post..." />
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{isEditing ? 'Edit Post' : 'Create New Post'}</CardTitle>
          {post && <StatusBadge status={post.status} />}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-red-800">
              <p>{error}</p>
            </div>
          )}

          {/* Title */}
          <Input
            label="Title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter post title"
            required
          />

          {/* Slug */}
          <div>
            <Input
              label="Slug"
              type="text"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="post-slug-here"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              URL: /blog/{slug || 'post-slug-here'}
              {slugManuallyEdited && <span className="ml-2 text-amber-600">(custom slug)</span>}
            </p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">
              Description{' '}
              {post?.status !== 'draft' ? (
                ''
              ) : (
                <span className="font-normal text-gray-400">(optional for drafts)</span>
              )}
            </label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary displayed below the title on the blog page"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-mvm-blue focus:outline-none focus:ring-2 focus:ring-mvm-blue focus:ring-opacity-20"
            />
            <p className="mt-1 text-sm text-gray-500">
              This appears directly below the blog title on the frontend
            </p>
          </div>

          {/* Cover Image */}
          <ImageUploader
            label="Cover Image"
            onUpload={handleCoverUpload}
            currentUrl={coverImageUrl}
            maxSizeMB={5}
            aspectRatio="16:9"
            aspectRatioHelp="Upload a 16:9 cover image (recommended 1200x675 px; larger sizes like 1600x900 or 1920×1080 also work)"
          />

          {/* Category */}
          <div>
            <label htmlFor="category" className="mb-1 block text-sm font-medium text-gray-700">
              Category{' '}
              {post?.status !== 'draft' ? (
                ''
              ) : (
                <span className="font-normal text-gray-400">(optional for drafts)</span>
              )}
            </label>
            <select
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-mvm-blue focus:outline-none focus:ring-2 focus:ring-mvm-blue focus:ring-opacity-20"
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Contributor */}
          <div>
            <label htmlFor="contributor" className="mb-1 block text-sm font-medium text-gray-700">
              Contributor{' '}
              {post?.status !== 'draft' ? (
                ''
              ) : (
                <span className="font-normal text-gray-400">(optional for drafts)</span>
              )}
            </label>
            <select
              id="contributor"
              value={contributorId}
              onChange={(e) => setContributorId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-mvm-blue focus:outline-none focus:ring-2 focus:ring-mvm-blue focus:ring-opacity-20"
            >
              <option value="">Select a contributor</option>
              {contributors.map((contributor) => (
                <option key={contributor.id} value={contributor.id}>
                  {contributor.full_name}
                </option>
              ))}
            </select>
          </div>

          {/* Content Input Method Toggle */}
          <div className="space-y-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Content Input Method
            </label>
            <div className="flex gap-6">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="contentType"
                  value="tiptap"
                  checked={contentType === 'tiptap'}
                  onChange={(e) => setContentType(e.target.value as ContentType)}
                  className="h-4 w-4 border-gray-300 text-mvm-blue focus:ring-mvm-blue"
                />
                <span className="text-sm text-gray-700">Tiptap Editor (Recommended)</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="contentType"
                  value="html"
                  checked={contentType === 'html'}
                  onChange={(e) => setContentType(e.target.value as ContentType)}
                  className="h-4 w-4 border-gray-300 text-mvm-blue focus:ring-mvm-blue"
                />
                <span className="text-sm text-gray-700">Raw HTML (Legacy Content)</span>
              </label>
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Content{' '}
              {post?.status !== 'draft' ? (
                ''
              ) : (
                <span className="font-normal text-gray-400">(optional for drafts)</span>
              )}
            </label>
            {contentType === 'tiptap' ? (
              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="Write your post content here..."
              />
            ) : (
              <div className="space-y-2">
                <textarea
                  id="html-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[400px] w-full rounded-lg border border-gray-300 p-4 font-mono text-sm text-gray-900 placeholder-gray-400 focus:border-mvm-blue focus:outline-none focus:ring-2 focus:ring-mvm-blue focus:ring-opacity-20"
                  placeholder="<p>Paste your HTML content here...</p>"
                />
                <p className="text-sm text-amber-600">
                  ⚠️ HTML will be rendered as-is. Ensure content is safe and properly formatted.
                </p>
              </div>
            )}
            <p className="mt-2 text-sm text-gray-500">
              Estimated reading time: {calculateReadingTime(content)} min
            </p>
          </div>

          {/* Published Date */}
          <div>
            <label
              htmlFor="published-date"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Published Date <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input
              type="datetime-local"
              id="published-date"
              value={publishedDate}
              onChange={(e) => setPublishedDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-mvm-blue focus:outline-none focus:ring-2 focus:ring-mvm-blue focus:ring-opacity-20"
            />
            <p className="mt-1 text-sm text-gray-500">
              Leave empty to use current date/time when publishing. Used in SEO metadata and RSS
              feeds.
            </p>
          </div>

          {/* SEO Configuration Section */}
          <div className="border-t pt-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">SEO Configuration</h3>
            <div className="space-y-6">
              {/* SEO Meta Title */}
              <div>
                <Input
                  label={`SEO Meta Title ${post?.status !== 'draft' ? '' : '(optional for drafts)'}`}
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="SEO-optimized title (max 60 chars)"
                  maxLength={60}
                />
                <p className="mt-1 text-sm text-gray-500">{seoTitle.length}/60 characters</p>
              </div>

              {/* SEO Meta Description */}
              <div>
                <label
                  htmlFor="seo-description"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  SEO Meta Description{' '}
                  {post?.status !== 'draft' ? (
                    ''
                  ) : (
                    <span className="font-normal text-gray-400">(optional for drafts)</span>
                  )}
                </label>
                <textarea
                  id="seo-description"
                  rows={3}
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="SEO-optimized description (max 160 chars)"
                  maxLength={160}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-mvm-blue focus:outline-none focus:ring-2 focus:ring-mvm-blue focus:ring-opacity-20"
                />
                <p className="mt-1 text-sm text-gray-500">{seoDescription.length}/160 characters</p>
              </div>

              {/* SEO Keywords */}
              <div>
                <label
                  htmlFor="seo-keywords"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  SEO Keywords <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <Input
                  id="seo-keywords"
                  type="text"
                  value={seoKeywords}
                  onChange={(e) => setSeoKeywords(e.target.value)}
                  placeholder="keyword1, keyword2, keyword3"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Comma-separated keywords for search engines
                </p>
              </div>

              {/* Schema.org Structured Data */}
              <div className="space-y-4 rounded-lg border border-gray-200 p-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">
                    Schema.org Structured Data
                  </h4>
                  <p className="mt-1 text-sm text-gray-600">
                    Article schema is auto-generated. Add additional schemas for rich results.
                  </p>
                </div>

                {/* Show info about default Article schema */}
                <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
                  <p className="text-sm font-medium text-blue-900">
                    ✓ Default Article Schema (Auto-generated)
                  </p>
                  <p className="mt-1 text-xs text-blue-700">
                    Includes: headline, description, contributor, publisher, datePublished, image
                  </p>
                </div>

                {/* Additional Schemas Editor */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Additional Schemas <span className="font-normal text-gray-400">(optional)</span>
                  </label>
                  <JsonLdSchemaEditor schemas={additionalSchemas} onChange={setAdditionalSchemas} />
                </div>

                {/* Help Text */}
                <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm">
                  <p className="mb-2 font-medium text-gray-900">📚 Common Use Cases:</p>
                  <ul className="list-inside list-disc space-y-1 text-xs text-gray-700">
                    <li>
                      <strong>FAQ Schema</strong>: For blog posts with Q&A sections
                    </li>
                    <li>
                      <strong>HowTo Schema</strong>: For tutorial/guide articles
                    </li>
                    <li>
                      <strong>Recipe Schema</strong>: For cooking/recipe content
                    </li>
                    <li>
                      <strong>Product Schema</strong>: For product reviews/comparisons
                    </li>
                  </ul>
                </div>
              </div>
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
              publishedAt={post.published_date}
              variant="detailed"
            />
          )}

          {/* Actions */}
          <div className="flex gap-4 border-t pt-6">
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Save as Draft'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isPending}
            >
              Cancel
            </Button>
            {(!isEditing || post?.status === 'draft') && (
              <div className="ml-auto text-sm text-gray-500">
                New posts are saved as drafts. Only title and slug are required.
              </div>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
