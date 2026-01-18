import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

export interface AuditLogEntry {
  id: string
  actor_id: string | null
  action_type: string
  target_type: string
  target_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface CreateAuditLogParams {
  actorId: string | null
  actionType: string
  targetType: string
  targetId?: string | null
  metadata?: Record<string, unknown>
}

/**
 * Audit log action types
 */
export const AUDIT_ACTION_TYPES = {
  // Authentication
  LOGIN_SUCCESS: 'auth.login.success',
  LOGIN_FAILURE: 'auth.login.failure',
  LOGOUT: 'auth.logout',
  PASSWORD_RESET_REQUEST: 'auth.password_reset_request',
  PASSWORD_RESET: 'auth.password_reset',
  PASSWORD_CHANGE: 'auth.password_change',

  // Users
  USER_INVITE: 'user.invite',
  USER_CREATE: 'user.create',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  USER_STATUS_CHANGE: 'user.status_change',
  USER_ACTIVATED: 'user.activated',
  USER_AVATAR_UPDATE: 'user.avatar_update',

  // Roles
  ROLE_CREATE: 'role.create',
  ROLE_UPDATE: 'role.update',
  ROLE_DELETE: 'role.delete',

  // Permissions
  PERMISSION_SYNC: 'permission.sync',
  PERMISSION_ASSIGN: 'permission.assign',
  PERMISSION_REVOKE: 'permission.revoke',

  // System
  SYSTEM_CONFIG_UPDATE: 'system.config_update',
  SYSTEM_ERROR: 'system.error',

  // Blog - Categories
  BLOG_CATEGORY_CREATED: 'blog.category.created',
  BLOG_CATEGORY_UPDATED: 'blog.category.updated',
  BLOG_CATEGORY_DELETED: 'blog.category.deleted',

  // Blog - Contributors
  BLOG_CONTRIBUTOR_CREATED: 'blog.contributor.created',
  BLOG_CONTRIBUTOR_UPDATED: 'blog.contributor.updated',
  BLOG_CONTRIBUTOR_DELETED: 'blog.contributor.deleted',

  // Blog - Posts
  BLOG_POST_CREATED: 'blog.post.created',
  BLOG_POST_UPDATED: 'blog.post.updated',
  BLOG_POST_DELETED: 'blog.post.deleted',
  BLOG_POST_PUBLISHED: 'blog.post.published',
  BLOG_POST_UNPUBLISHED: 'blog.post.unpublished',

  // Job Posts
  JOB_POST_CREATED: 'job_post_created',
  JOB_POST_UPDATED: 'job_post_updated',
  JOB_POST_PUBLISHED: 'job_post_published',
  JOB_POST_UNPUBLISHED: 'job_post_unpublished',
  JOB_POST_DELETED: 'job_post_deleted',
  JOB_CATEGORY_CREATED: 'job_category_created',
  JOB_CATEGORY_UPDATED: 'job_category_updated',
  JOB_CATEGORY_DELETED: 'job_category_deleted',
} as const

/**
 * Create audit log entry
 */
export async function createAuditLog({
  actorId,
  actionType,
  targetType,
  targetId = null,
  metadata = {},
}: CreateAuditLogParams): Promise<{
  success: boolean
  error?: string
  id?: string
}> {
  try {
    const adminClient = await createAdminClient()

    const { data, error } = await adminClient
      .from('user_audit_logs')
      .insert({
        actor_id: actorId,
        action_type: actionType,
        target_type: targetType,
        target_id: targetId,
        metadata,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Failed to create audit log:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      id: data.id,
    }
  } catch (error) {
    console.error('Audit log error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get audit logs with pagination and filters
 */
export async function getAuditLogs(params: {
  page?: number
  limit?: number
  actionType?: string
  actorId?: string
  targetType?: string
  startDate?: string
  endDate?: string
}): Promise<{
  success: boolean
  data?: {
    logs: (AuditLogEntry & {
      actor?: {
        name: string
        email: string
      }
    })[]
    total: number
    page: number
    limit: number
    totalPages: number
  }
  error?: string
}> {
  try {
    const supabase = await createClient()
    const { page = 1, limit = 50, actionType, actorId, targetType, startDate, endDate } = params

    // Build query
    let query = supabase
      .from('user_audit_logs')
      .select(
        `
        *,
        actor:users!user_audit_logs_actor_id_fkey(name, email)
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })

    // Apply filters
    if (actionType) {
      query = query.eq('action_type', actionType)
    }
    if (actorId) {
      query = query.eq('actor_id', actorId)
    }
    if (targetType) {
      query = query.eq('target_type', targetType)
    }
    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('Failed to fetch audit logs:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    const total = count || 0
    const totalPages = Math.ceil(total / limit)

    return {
      success: true,
      data: {
        logs: data || [],
        total,
        page,
        limit,
        totalPages,
      },
    }
  } catch (error) {
    console.error('Get audit logs error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get audit logs for a specific target
 */
export async function getAuditLogsForTarget(
  targetType: string,
  targetId: string
): Promise<{
  success: boolean
  data?: (AuditLogEntry & {
    actor?: {
      name: string
      email: string
    }
  })[]
  error?: string
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('user_audit_logs')
      .select(
        `
        *,
        actor:users!user_audit_logs_actor_id_fkey(name, email)
      `
      )
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Failed to fetch target audit logs:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    console.error('Get target audit logs error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get audit log statistics
 */
export async function getAuditLogStats(): Promise<{
  success: boolean
  data?: {
    totalLogs: number
    todayLogs: number
    weekLogs: number
    topActions: { action_type: string; count: number }[]
  }
  error?: string
}> {
  try {
    const supabase = await createClient()

    // Get total logs
    const { count: totalLogs } = await supabase
      .from('user_audit_logs')
      .select('*', { count: 'exact', head: true })

    // Get today's logs
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { count: todayLogs } = await supabase
      .from('user_audit_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())

    // Get this week's logs
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const { count: weekLogs } = await supabase
      .from('user_audit_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString())

    // Get top action types (using RPC for aggregation)
    // Note: This is a simple version. For production, create a Postgres function
    const { data: allLogs } = await supabase
      .from('user_audit_logs')
      .select('action_type')
      .limit(1000)

    const actionCounts: Record<string, number> = {}
    allLogs?.forEach((log) => {
      actionCounts[log.action_type] = (actionCounts[log.action_type] || 0) + 1
    })

    const topActions = Object.entries(actionCounts)
      .map(([action_type, count]) => ({ action_type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return {
      success: true,
      data: {
        totalLogs: totalLogs || 0,
        todayLogs: todayLogs || 0,
        weekLogs: weekLogs || 0,
        topActions,
      },
    }
  } catch (error) {
    console.error('Get audit stats error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Delete old audit logs (cleanup)
 */
export async function deleteOldAuditLogs(daysToKeep: number = 90): Promise<{
  success: boolean
  deletedCount?: number
  error?: string
}> {
  try {
    const adminClient = await createAdminClient()

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    const { data, error } = await adminClient
      .from('user_audit_logs')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .select('id')

    if (error) {
      console.error('Failed to delete old audit logs:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      deletedCount: data?.length || 0,
    }
  } catch (error) {
    console.error('Delete old audit logs error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
