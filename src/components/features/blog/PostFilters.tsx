'use client'

import type { BlogCategory, BlogContributor, BlogPostStatus } from '@/types'

interface PostFiltersProps {
  statusFilter: BlogPostStatus | 'all'
  categoryFilter: string
  contributorFilter: string
  onStatusChange: (status: BlogPostStatus | 'all') => void
  onCategoryChange: (categoryId: string) => void
  onContributorChange: (contributorId: string) => void
  categories: BlogCategory[]
  contributors: BlogContributor[]
}

export function PostFilters({
  statusFilter,
  categoryFilter,
  contributorFilter,
  onStatusChange,
  onCategoryChange,
  onContributorChange,
  categories,
  contributors,
}: PostFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <div>
        <label htmlFor="status-filter" className="sr-only">
          Filter by status
        </label>
        <select
          id="status-filter"
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value as BlogPostStatus | 'all')}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-mvm-blue focus:outline-none focus:ring-2 focus:ring-mvm-blue focus:ring-opacity-20"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="unpublished">Unpublished</option>
        </select>
      </div>

      <div>
        <label htmlFor="category-filter" className="sr-only">
          Filter by category
        </label>
        <select
          id="category-filter"
          value={categoryFilter}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-mvm-blue focus:outline-none focus:ring-2 focus:ring-mvm-blue focus:ring-opacity-20"
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="contributor-filter" className="sr-only">
          Filter by contributor
        </label>
        <select
          id="contributor-filter"
          value={contributorFilter}
          onChange={(e) => onContributorChange(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-mvm-blue focus:outline-none focus:ring-2 focus:ring-mvm-blue focus:ring-opacity-20"
        >
          <option value="">All Contributors</option>
          {contributors.map((contributor) => (
            <option key={contributor.id} value={contributor.id}>
              {contributor.full_name}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
