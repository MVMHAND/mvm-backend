/**
 * @deprecated This file is deprecated. Use functions from @/lib/dal instead.
 * 
 * Migration guide:
 * - hasPermission() -> import { hasPermission } from '@/lib/dal'
 * - getUserPermissions() -> import { getUserPermissions } from '@/lib/dal'
 * - isSuperAdmin() -> import { isSuperAdmin } from '@/lib/dal'
 * 
 * The DAL provides better security, performance (with React cache), and type safety.
 */

import {
  hasPermission as dalHasPermission,
  getUserPermissions as dalGetUserPermissions,
  isSuperAdmin as dalIsSuperAdmin,
} from '@/lib/dal'

/**
 * @deprecated Use hasPermission from @/lib/dal instead
 */
export const hasPermission = dalHasPermission

/**
 * @deprecated Use getUserPermissions from @/lib/dal instead
 */
export const getUserPermissions = dalGetUserPermissions

/**
 * @deprecated Use isSuperAdmin from @/lib/dal instead
 */
export const isSuperAdmin = dalIsSuperAdmin
