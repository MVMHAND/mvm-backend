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
  params: { [key: string]: string }
  searchParams: { [key: string]: string | string[] | undefined }
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
