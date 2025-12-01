import { formatDateTime } from '@/lib/utils'
import type { BlogPost, BlogCategory, BlogContributor } from '@/types'

interface PostPreviewProps {
  post: BlogPost
  category: BlogCategory
  contributor: BlogContributor
}

export function PostPreview({ post, category, contributor }: PostPreviewProps) {
  return (
    <article className="mx-auto max-w-4xl">
      {/* Cover Image */}
      {post.cover_image_url && (
        <div className="mb-8 overflow-hidden rounded-lg">
          <img
            src={post.cover_image_url}
            alt={post.title}
            className="h-96 w-full object-cover"
          />
        </div>
      )}

      {/* Metadata */}
      <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-gray-600">
        <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
          {category.name}
        </span>
        <span>By {contributor.full_name}</span>
        {post.published_date && (
          <span>{formatDateTime(post.published_date)}</span>
        )}
        <span>{post.reading_time} min read</span>
      </div>

      {/* Title */}
      <h1 className="mb-4 text-4xl font-bold text-gray-900">{post.title}</h1>

      {/* SEO Description */}
      <p className="mb-8 text-xl text-gray-600">{post.seo_meta_description}</p>

      {/* Divider */}
      <hr className="mb-8 border-gray-200" />

      {/* Content */}
      <div
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* Author Card */}
      <div className="mt-12 border-t border-gray-200 pt-8">
        <div className="flex items-start gap-4">
          {contributor.avatar_url ? (
            <img
              src={contributor.avatar_url}
              alt={contributor.full_name}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-mvm text-xl font-bold text-white">
              {contributor.full_name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{contributor.full_name}</h3>
            <p className="text-sm text-mvm-blue">{contributor.position}</p>
            <p className="mt-2 text-sm text-gray-600">{contributor.bio}</p>
          </div>
        </div>
      </div>
    </article>
  )
}
