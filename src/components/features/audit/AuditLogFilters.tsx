'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'

interface AuditLogFiltersProps {
  initialFilters: {
    actionType?: string
    actorId?: string
    targetType?: string
    startDate?: string
    endDate?: string
  }
}

const ACTION_TYPE_GROUPS = [
  {
    label: 'Authentication',
    options: [
      { value: 'auth.login.success', label: 'Login Success' },
      { value: 'auth.login.failure', label: 'Login Failure' },
      { value: 'auth.logout', label: 'Logout' },
    ],
  },
  {
    label: 'User Management',
    options: [
      { value: 'user.invite', label: 'User Invited' },
      { value: 'user.create', label: 'User Created' },
      { value: 'user.update', label: 'User Updated' },
      { value: 'user.delete', label: 'User Deleted' },
      { value: 'user.status_change', label: 'Status Changed' },
      { value: 'user.activated', label: 'User Activated' },
    ],
  },
  {
    label: 'Roles & Permissions',
    options: [
      { value: 'role.create', label: 'Role Created' },
      { value: 'role.update', label: 'Role Updated' },
      { value: 'role.delete', label: 'Role Deleted' },
    ],
  },
  {
    label: 'Blog',
    options: [
      { value: 'blog.post.created', label: 'Post Created' },
      { value: 'blog.post.updated', label: 'Post Updated' },
      { value: 'blog.post.published', label: 'Post Published' },
      { value: 'blog.post.unpublished', label: 'Post Unpublished' },
      { value: 'blog.post.deleted', label: 'Post Deleted' },
      { value: 'blog.category.created', label: 'Category Created' },
      { value: 'blog.category.updated', label: 'Category Updated' },
      { value: 'blog.category.deleted', label: 'Category Deleted' },
    ],
  },
  {
    label: 'Job Posts',
    options: [
      { value: 'job.post.created', label: 'Job Created' },
      { value: 'job.post.updated', label: 'Job Updated' },
      { value: 'job.post.published', label: 'Job Published' },
      { value: 'job.post.deleted', label: 'Job Deleted' },
      { value: 'job.category.created', label: 'Category Created' },
      { value: 'job.category.deleted', label: 'Category Deleted' },
    ],
  },
]

const DATE_PRESETS = [
  { value: 'today', label: 'Today' },
  { value: '7days', label: 'Last 7 days' },
  { value: '30days', label: 'Last 30 days' },
  { value: 'custom', label: 'Custom range' },
]

const TARGET_TYPES = [
  { value: '', label: 'All Targets' },
  { value: 'user', label: 'User' },
  { value: 'role', label: 'Role' },
  { value: 'permission', label: 'Permission' },
  { value: 'blog_post', label: 'Blog Post' },
  { value: 'blog_category', label: 'Blog Category' },
  { value: 'blog_contributor', label: 'Blog Contributor' },
  { value: 'job_post', label: 'Job Post' },
  { value: 'job_category', label: 'Job Category' },
  { value: 'system', label: 'System' },
]

export function AuditLogFilters({ initialFilters }: AuditLogFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [actionType, setActionType] = useState(initialFilters.actionType || '')
  const [targetType, setTargetType] = useState(initialFilters.targetType || '')
  const [startDate, setStartDate] = useState(initialFilters.startDate || '')
  const [endDate, setEndDate] = useState(initialFilters.endDate || '')
  const [datePreset, setDatePreset] = useState('custom')

  const applyDatePreset = (preset: string) => {
    setDatePreset(preset)
    const today = new Date()
    const formatDate = (d: Date) => d.toISOString().split('T')[0]

    switch (preset) {
      case 'today':
        setStartDate(formatDate(today))
        setEndDate(formatDate(today))
        break
      case '7days':
        const weekAgo = new Date(today)
        weekAgo.setDate(today.getDate() - 7)
        setStartDate(formatDate(weekAgo))
        setEndDate(formatDate(today))
        break
      case '30days':
        const monthAgo = new Date(today)
        monthAgo.setDate(today.getDate() - 30)
        setStartDate(formatDate(monthAgo))
        setEndDate(formatDate(today))
        break
      case 'custom':
        break
    }
  }

  const handleFilter = () => {
    const params = new URLSearchParams(searchParams.toString())

    if (actionType) {
      params.set('actionType', actionType)
    } else {
      params.delete('actionType')
    }

    if (targetType) {
      params.set('targetType', targetType)
    } else {
      params.delete('targetType')
    }

    if (startDate) {
      params.set('startDate', startDate)
    } else {
      params.delete('startDate')
    }

    if (endDate) {
      params.set('endDate', endDate)
    } else {
      params.delete('endDate')
    }

    // Reset to page 1 when filtering
    params.delete('page')

    router.push(`/admin/audit-logs?${params.toString()}`)
  }

  const handleReset = () => {
    setActionType('')
    setTargetType('')
    setStartDate('')
    setEndDate('')
    router.push('/admin/audit-logs')
  }

  return (
    <div className="space-y-4">
      {/* Date Presets */}
      <div className="flex flex-wrap gap-2">
        {DATE_PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => applyDatePreset(preset.value)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              datePreset === preset.value
                ? 'bg-mvm-blue text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Action Type</label>
          <select
            value={actionType}
            onChange={(e) => setActionType(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-mvm-blue focus:outline-none focus:ring-2 focus:ring-mvm-blue/20"
          >
            <option value="">All Actions</option>
            {ACTION_TYPE_GROUPS.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Target Type</label>
          <select
            value={targetType}
            onChange={(e) => setTargetType(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-mvm-blue focus:outline-none focus:ring-2 focus:ring-mvm-blue/20"
          >
            {TARGET_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-mvm-blue focus:outline-none focus:ring-2 focus:ring-mvm-blue/20"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-mvm-blue focus:outline-none focus:ring-2 focus:ring-mvm-blue/20"
          />
        </div>

        <div className="flex items-end gap-2 md:col-span-2 lg:col-span-4">
          <Button onClick={handleFilter}>Apply Filters</Button>
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
        </div>
      </div>
    </div>
  )
}
