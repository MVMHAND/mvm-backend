/**
 * Database type definitions
 * These should be generated from Supabase schema in production
 */

export type UserStatus = 'active' | 'inactive' | 'deleted'

export interface Profile {
  id: string
  name: string
  email: string
  avatar_url: string | null
  status: UserStatus
  role_id: string
  created_at: string
  updated_at: string
  last_login: string | null
}

export interface Role {
  id: string
  name: string
  description: string
  is_super_admin: boolean
  is_system: boolean
  created_at: string
  updated_at: string
}

export interface Permission {
  id: string
  permission_key: string
  label: string
  description: string
  group: string
  created_at: string
}

export interface RolePermission {
  id: string
  role_id: string
  permission_key: string
  created_at: string
}

export interface AuditLog {
  id: string
  actor_id: string
  action_type: string
  target_type: string
  target_id: string | null
  metadata: Record<string, unknown>
  created_at: string
}

// Database relationships
export interface ProfileWithRole extends Profile {
  role: Role
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[]
  user_count?: number
}

// Insert types (for creating new records)
export type ProfileInsert = Omit<Profile, 'id' | 'created_at' | 'updated_at'>
export type RoleInsert = Omit<Role, 'id' | 'created_at' | 'updated_at'>
export type PermissionInsert = Omit<Permission, 'id' | 'created_at'>
export type RolePermissionInsert = Omit<RolePermission, 'id' | 'created_at'>
export type AuditLogInsert = Omit<AuditLog, 'id' | 'created_at'>

// Update types
export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'created_at' | 'email'>>
export type RoleUpdate = Partial<Omit<Role, 'id' | 'created_at' | 'is_super_admin'>>
