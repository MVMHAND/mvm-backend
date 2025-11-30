'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  getAuditLogs,
  getAuditLogsForTarget,
  getAuditLogStats,
  deleteOldAuditLogs,
} from '@/lib/audit'
import type { ActionResponse } from '@/types'

/**
 * Get paginated audit logs with filters
 */
export async function getAuditLogsAction(params: {
  page?: number
  limit?: number
  actionType?: string
  actorId?: string
  targetType?: string
  startDate?: string
  endDate?: string
}): Promise<ActionResponse> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  const result = await getAuditLogs(params)

  if (!result.success) {
    return {
      success: false,
      error: result.error || 'Failed to fetch audit logs',
    }
  }

  return {
    success: true,
    data: result.data,
  }
}

/**
 * Get audit logs for a specific target (user, role, etc.)
 */
export async function getAuditLogsForTargetAction(
  targetType: string,
  targetId: string
): Promise<ActionResponse> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  const result = await getAuditLogsForTarget(targetType, targetId)

  if (!result.success) {
    return {
      success: false,
      error: result.error || 'Failed to fetch audit logs',
    }
  }

  return {
    success: true,
    data: result.data,
  }
}

/**
 * Get audit log statistics
 */
export async function getAuditLogStatsAction(): Promise<ActionResponse> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  const result = await getAuditLogStats()

  if (!result.success) {
    return {
      success: false,
      error: result.error || 'Failed to fetch audit log statistics',
    }
  }

  return {
    success: true,
    data: result.data,
  }
}

/**
 * Delete old audit logs (cleanup) - Super Admin only
 */
export async function deleteOldAuditLogsAction(daysToKeep: number = 90): Promise<ActionResponse> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  // Get user profile with role
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, role:roles(*)')
    .eq('id', user.id)
    .single()

  // Only Super Admin can delete audit logs
  if (!profile?.role?.is_super_admin) {
    return {
      success: false,
      error: 'Only Super Admin can delete audit logs',
    }
  }

  const result = await deleteOldAuditLogs(daysToKeep)

  if (!result.success) {
    return {
      success: false,
      error: result.error || 'Failed to delete old audit logs',
    }
  }

  return {
    success: true,
    data: {
      deletedCount: result.deletedCount,
      message: `Successfully deleted ${result.deletedCount} old audit logs`,
    },
  }
}
