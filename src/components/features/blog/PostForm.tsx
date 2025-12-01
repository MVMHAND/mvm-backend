'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ImageUploader } from './ImageUploader'
import { RichTextEditor } from './RichTextEditor'
import { StatusBadge } from './StatusBadge'
import {
  createPostAction,
  updatePostAction,
  uploadPostCoverAction,
} from '@/actions/blog-posts'
import { slugify } from '@/lib/utils'
import type { BlogPost } from '@/types'

interface CategoryOption {
  id: string
  name: string
}

interface ContributorOption {
  id: string
  full_name: string
}

interface PostFormProps {
  post?: BlogPost
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
  const [seoTitle, setSeoTitle] = useState(post?.seo_meta_title || '')
  const [seoDescription, setSeoDescription] = useState(post?.seo_meta_description || '')
  const [slug, setSlug] = useState(post?.slug || '')
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(post?.cover_image_url || null)
  const [categoryId, setCategoryId] = useState(post?.category_id || '')
  const [contributorId, setContributorId] = useState(post?.contributor_id || '')
  const [content, setContent] = useState(post?.content || '')

  // Auto-generate slug from title
  useEffect(() => {
    if (!isEditing && title && !slug) {
      setSlug(slugify(title))
    }
  }, [title, slug, isEditing])

  // Calculate reading time (200 words per minute)
  const calculateReadingTime = (htmlContent: string): number => {
    const text = htmlContent.replace(/<[^>]*>/g, '')
    const wordCount = text.trim().split(/\s+/).length
    return Math.max(1, Math.ceil(wordCount / 200))
  }

  const handleCoverUpload = async (file: File) => {
    const formData = new FormData()
    formData.append('cover', file)

    if (post?.id) {
      const result = await uploadPostCoverAction(post.id, formData)

      if (result.success && result.data) {
        setCoverImageUrl(result.data)
      }

      return result
    }

    // For new posts, just show preview
    return { success: true }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!title.trim()) {
      setError('Title is required')
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

    if (!slug.trim()) {
      setError('Slug is required')
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

    startTransition(async () => {
      const readingTime = calculateReadingTime(content)

      const data = {
        title: title.trim(),
        seo_meta_title: seoTitle.trim(),
        seo_meta_description: seoDescription.trim(),
        slug: slug.trim(),
        cover_image_url: coverImageUrl,
        category_id: categoryId,
        contributor_id: contributorId,
        content,
        reading_time: readingTime,
        status: (post?.status || 'draft') as 'draft' | 'published' | 'unpublished',
      }

      const result =
        isEditing && post
          ? await updatePostAction(post.id, data)
          : await createPostAction(data)

      if (result.success) {
        router.push('/admin/blog/posts')
        router.refresh()
      } else {
        setError(result.error || 'An error occurred')
      }
    })
  }

  return (
    <Card>
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

          {/* SEO Meta Title */}
          <div>
            <Input
              label="SEO Meta Title"
              type="text"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder="SEO-optimized title (max 60 chars)"
              maxLength={60}
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              {seoTitle.length}/60 characters
            </p>
          </div>

          {/* SEO Meta Description */}
          <div>
            <label htmlFor="seo-description" className="mb-1 block text-sm font-medium text-gray-700">
              SEO Meta Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="seo-description"
              rows={3}
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              placeholder="SEO-optimized description (max 160 chars)"
              maxLength={160}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-mvm-blue focus:outline-none focus:ring-2 focus:ring-mvm-blue focus:ring-opacity-20"
            />
            <p className="mt-1 text-sm text-gray-500">
              {seoDescription.length}/160 characters
            </p>
          </div>

          {/* Slug */}
          <div>
            <Input
              label="Slug"
              type="text"
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              placeholder="post-slug-here"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              URL: /blog/{slug || 'post-slug-here'}
            </p>
          </div>

          {/* Cover Image */}
          <ImageUploader
            label="Cover Image (optional)"
            onUpload={handleCoverUpload}
            currentUrl={coverImageUrl}
            maxSizeMB={5}
          />

          {/* Category */}
          <div>
            <label htmlFor="category" className="mb-1 block text-sm font-medium text-gray-700">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
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
              Author <span className="text-red-500">*</span>
            </label>
            <select
              id="contributor"
              value={contributorId}
              onChange={(e) => setContributorId(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-mvm-blue focus:outline-none focus:ring-2 focus:ring-mvm-blue focus:ring-opacity-20"
            >
              <option value="">Select an author</option>
              {contributors.map((contributor) => (
                <option key={contributor.id} value={contributor.id}>
                  {contributor.full_name}
                </option>
              ))}
            </select>
          </div>

          {/* Content */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Content <span className="text-red-500">*</span>
            </label>
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Write your post content here..."
            />
            <p className="mt-2 text-sm text-gray-500">
              Estimated reading time: {calculateReadingTime(content)} min
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-4 border-t pt-6">
            <Button type="submit" disabled={isPending}>
              {isPending
                ? isEditing
                  ? 'Saving...'
                  : 'Creating...'
                : isEditing
                  ? 'Save Changes'
                  : 'Create Post'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isPending}
            >
              Cancel
            </Button>
            {post && post.status === 'draft' && (
              <div className="ml-auto text-sm text-gray-500">
                Save as draft and publish later from the posts list
              </div>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
