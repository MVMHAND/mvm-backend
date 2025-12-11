/**
 * Central type exports
 */

export type {
  Profile,
  Role,
  Permission,
  RolePermission,
  AuditLog,
  ProfileWithRole,
  RoleWithPermissions,
  ProfileInsert,
  RoleInsert,
  PermissionInsert,
  RolePermissionInsert,
  AuditLogInsert,
  ProfileUpdate,
  RoleUpdate,
  UserStatus,
  UserWithRole,
} from './database'

// Component prop types
export interface PageProps {
  params: Promise<Record<string, string>>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

// Server action response types
export interface ActionResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Pagination types
export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Auth types
export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthUser {
  id: string
  email: string
  name: string
  avatar_url: string | null
  role: {
    id: string
    name: string
    is_super_admin: boolean
  }
}

// Menu configuration types
export type { MenuItem, MenuPermissionMetadata } from '@/config/menu'

// Audit types
export interface AuditLogStats {
  totalLogs: number
  todayLogs: number
  weekLogs: number
  topActions: { action_type: string; count: number }[]
}

export interface AuditLogEntry {
  id: string
  actor_id: string | null
  action_type: string
  target_type: string
  target_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  actor?: {
    name: string
    email: string
  }
}

export interface PaginatedAuditLogs {
  logs: AuditLogEntry[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Blog types
export type {
  BlogCategory,
  BlogCategoryWithUsers,
  BlogContributor,
  BlogContributorWithUsers,
  BlogPost,
  BlogPostWithRelations,
  BlogPostStatus,
  BlogCategoryFormData,
  BlogContributorFormData,
  BlogPostFormData,
  BlogPostFilters,
  CategoryValidationResult,
  ContributorValidationResult,
  PostValidationResult,
  SEOValidation,
} from './blog'

// Allowed domains types
export type {
  AllowedDomain,
  AllowedDomainWithUsers,
  AllowedDomainFormData,
} from './allowed-domains'
