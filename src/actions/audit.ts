'use server'

import { verifySession, isSuperAdmin } from '@/lib/dal'
import {
  getAuditLogs,
  getAuditLogsForTarget,
  getAuditLogStats,
  deleteOldAuditLogs,
} from '@/lib/audit'
import type { ActionResponse, AuditLogStats, PaginatedAuditLogs } from '@/types'

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
}): Promise<ActionResponse<PaginatedAuditLogs>> {
  // SECURITY: Validate authentication with DAL
  await verifySession()

  const result = await getAuditLogs(params)

  if (!result.success) {
    return {
      success: false,
      error: result.error || 'Failed to fetch audit logs',
    }
  }

  return {
    success: true,
    data: result.data as PaginatedAuditLogs,
  }
}

/**
 * Get audit logs for a specific target (user, role, etc.)
 */
export async function getAuditLogsForTargetAction(
  targetType: string,
  targetId: string
): Promise<ActionResponse> {
  // SECURITY: Validate authentication with DAL
  await verifySession()

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
export async function getAuditLogStatsAction(): Promise<ActionResponse<AuditLogStats>> {
  // SECURITY: Validate authentication with DAL
  await verifySession()

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
  // SECURITY: Validate authentication with DAL
  await verifySession()

  // Only Super Admin can delete audit logs
  const isAdmin = await isSuperAdmin()
  if (!isAdmin) {
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
