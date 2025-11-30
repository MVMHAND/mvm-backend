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

const ACTION_TYPES = [
  { value: '', label: 'All Actions' },
  { value: 'auth.login.success', label: 'Login Success' },
  { value: 'auth.login.failure', label: 'Login Failure' },
  { value: 'auth.logout', label: 'Logout' },
  { value: 'user.invite', label: 'User Invited' },
  { value: 'user.create', label: 'User Created' },
  { value: 'user.update', label: 'User Updated' },
  { value: 'user.delete', label: 'User Deleted' },
  { value: 'user.status_change', label: 'User Status Changed' },
  { value: 'user.activated', label: 'User Activated' },
  { value: 'role.create', label: 'Role Created' },
  { value: 'role.update', label: 'Role Updated' },
  { value: 'role.delete', label: 'Role Deleted' },
]

const TARGET_TYPES = [
  { value: '', label: 'All Targets' },
  { value: 'user', label: 'User' },
  { value: 'role', label: 'Role' },
  { value: 'permission', label: 'Permission' },
  { value: 'system', label: 'System' },
]

export function AuditLogFilters({ initialFilters }: AuditLogFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [actionType, setActionType] = useState(initialFilters.actionType || '')
  const [targetType, setTargetType] = useState(initialFilters.targetType || '')
  const [startDate, setStartDate] = useState(initialFilters.startDate || '')
  const [endDate, setEndDate] = useState(initialFilters.endDate || '')

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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Action Type</label>
        <select
          value={actionType}
          onChange={(e) => setActionType(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-mvm-blue focus:outline-none focus:ring-2 focus:ring-mvm-blue/20"
        >
          {ACTION_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
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

      <div className="flex gap-2 md:col-span-2 lg:col-span-4">
        <Button onClick={handleFilter}>Apply Filters</Button>
        <Button variant="outline" onClick={handleReset}>
          Reset
        </Button>
      </div>
    </div>
  )
}
