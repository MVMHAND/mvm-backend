'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResponse, Role, Permission, RoleWithPermissions } from '@/types'

/**
 * Get all roles for selection dropdowns
 */
export async function getRolesAction(): Promise<ActionResponse<Role[]>> {
  try {
    const supabase = await createClient()

    const { data: roles, error } = await supabase
      .from('user_roles')
      .select('id, name, description, is_super_admin, is_system, created_at, updated_at')
      .order('is_super_admin', { ascending: false })
      .order('name')

    if (error) {
      console.error('Error fetching roles:', error)
      return {
        success: false,
        error: 'Failed to fetch roles',
      }
    }

    return {
      success: true,
      data: roles || [],
    }
  } catch (error) {
    console.error('Error in getRolesAction:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get roles with user counts for the roles list page
 */
export async function getRolesWithCountsAction(
  search = ''
): Promise<
  ActionResponse<{ roles: (Role & { user_count: number })[]; total: number }>
> {
  try {
    const supabase = await createClient()

    // Get roles
    let query = supabase
      .from('user_roles')
      .select('*')
      .order('is_super_admin', { ascending: false })
      .order('name')

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data: roles, error: rolesError } = await query

    if (rolesError) {
      console.error('Error fetching roles:', rolesError)
      return {
        success: false,
        error: 'Failed to fetch roles',
      }
    }

    // Get user counts per role
    const { data: userCounts, error: countsError } = await supabase
      .from('users')
      .select('role_id')
      .neq('status', 'deleted')

    if (countsError) {
      console.error('Error fetching user counts:', countsError)
      return {
        success: false,
        error: 'Failed to fetch user counts',
      }
    }

    // Calculate counts
    const countMap = new Map<string, number>()
    userCounts?.forEach((profile) => {
      if (profile.role_id) {
        countMap.set(profile.role_id, (countMap.get(profile.role_id) || 0) + 1)
      }
    })

    const rolesWithCounts = (roles || []).map((role) => ({
      ...role,
      user_count: countMap.get(role.id) || 0,
    }))

    return {
      success: true,
      data: {
        roles: rolesWithCounts,
        total: rolesWithCounts.length,
      },
    }
  } catch (error) {
    console.error('Error in getRolesWithCountsAction:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get a single role by ID with its permissions
 */
export async function getRoleByIdAction(
  roleId: string
): Promise<ActionResponse<RoleWithPermissions>> {
  try {
    const supabase = await createClient()

    // Get role
    const { data: role, error: roleError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('id', roleId)
      .single()

    if (roleError) {
      return {
        success: false,
        error: 'Role not found',
      }
    }

    // Get role permissions
    const { data: rolePermissions, error: permError } = await supabase
      .from('user_role_permissions')
      .select('permission_key')
      .eq('role_id', roleId)

    if (permError) {
      console.error('Error fetching role permissions:', permError)
    }

    // Get all permissions to match against
    const { data: allPermissions } = await supabase
      .from('user_permissions')
      .select('*')
      .order('group')
      .order('label')

    const permissionKeys = new Set(rolePermissions?.map((rp) => rp.permission_key) || [])
    const permissions = (allPermissions || []).filter((p) =>
      permissionKeys.has(p.permission_key)
    )

    // Get user count
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role_id', roleId)
      .neq('status', 'deleted')

    return {
      success: true,
      data: {
        ...role,
        permissions,
        user_count: count || 0,
      },
    }
  } catch (error) {
    console.error('Error in getRoleByIdAction:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

interface RoleUser {
  id: string
  name: string
  email: string
  avatar_url: string | null
  status: string
}

/**
 * Get users assigned to a specific role
 */
export async function getRoleUsersAction(
  roleId: string
): Promise<ActionResponse<RoleUser[]>> {
  try {
    const supabase = await createClient()

    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, avatar_url, status')
      .eq('role_id', roleId)
      .neq('status', 'deleted')
      .order('name')

    if (error) {
      console.error('Error fetching role users:', error)
      return {
        success: false,
        error: 'Failed to fetch users',
      }
    }

    return {
      success: true,
      data: users || [],
    }
  } catch (error) {
    console.error('Error in getRoleUsersAction:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get all permissions grouped by category
 */
export async function getPermissionsAction(): Promise<
  ActionResponse<{ permissions: Permission[]; grouped: Record<string, Permission[]> }>
> {
  try {
    const supabase = await createClient()

    const { data: permissions, error } = await supabase
      .from('user_permissions')
      .select('*')
      .order('group')
      .order('label')

    if (error) {
      console.error('Error fetching permissions:', error)
      return {
        success: false,
        error: 'Failed to fetch permissions',
      }
    }

    // Group permissions by category
    const grouped = (permissions || []).reduce(
      (acc, permission) => {
        const group = permission.group
        if (!acc[group]) {
          acc[group] = []
        }
        acc[group].push(permission)
        return acc
      },
      {} as Record<string, Permission[]>
    )

    return {
      success: true,
      data: {
        permissions: permissions || [],
        grouped,
      },
    }
  } catch (error) {
    console.error('Error in getPermissionsAction:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get permissions assigned to a specific role
 */
export async function getRolePermissionsAction(
  roleId: string
): Promise<ActionResponse<string[]>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('user_role_permissions')
      .select('permission_key')
      .eq('role_id', roleId)

    if (error) {
      console.error('Error fetching role permissions:', error)
      return {
        success: false,
        error: 'Failed to fetch role permissions',
      }
    }

    return {
      success: true,
      data: data?.map((rp) => rp.permission_key) || [],
    }
  } catch (error) {
    console.error('Error in getRolePermissionsAction:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Create a new role
 */
export async function createRoleAction(formData: FormData): Promise<ActionResponse<Role>> {
  try {
    const supabase = await createClient()
    const adminClient = await createAdminClient()

    const name = formData.get('name') as string
    const description = formData.get('description') as string

    if (!name) {
      return {
        success: false,
        error: 'Role name is required',
      }
    }

    // Check if role already exists
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('name', name)
      .single()

    if (existingRole) {
      return {
        success: false,
        error: 'A role with this name already exists',
      }
    }

    // Create role using admin client
    const { data: role, error } = await adminClient
      .from('user_roles')
      .insert({
        name,
        description: description || null,
        is_super_admin: false,
        is_system: false,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating role:', error)
      return {
        success: false,
        error: 'Failed to create role',
      }
    }

    // Create audit log
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()

    if (currentUser) {
      await adminClient.from('user_audit_logs').insert({
        actor_id: currentUser.id,
        action_type: 'role.create',
        target_type: 'role',
        target_id: role.id,
        metadata: { name, description },
      })
    }

    revalidatePath('/admin/roles')

    return {
      success: true,
      data: role,
      message: 'Role created successfully',
    }
  } catch (error) {
    console.error('Error in createRoleAction:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Update a role
 */
export async function updateRoleAction(
  roleId: string,
  formData: FormData
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    const adminClient = await createAdminClient()

    // Check if this is a super admin role
    const { data: role } = await supabase
      .from('user_roles')
      .select('is_super_admin, name')
      .eq('id', roleId)
      .single()

    if (role?.is_super_admin) {
      return {
        success: false,
        error: 'Cannot modify Super Admin role',
      }
    }

    const name = formData.get('name') as string
    const description = formData.get('description') as string

    if (!name) {
      return {
        success: false,
        error: 'Role name is required',
      }
    }

    // Check if another role with this name exists
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('name', name)
      .neq('id', roleId)
      .single()

    if (existingRole) {
      return {
        success: false,
        error: 'A role with this name already exists',
      }
    }

    // Update role
    const { error } = await adminClient
      .from('user_roles')
      .update({
        name,
        description: description || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', roleId)

    if (error) {
      console.error('Error updating role:', error)
      return {
        success: false,
        error: 'Failed to update role',
      }
    }

    // Create audit log
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()

    if (currentUser) {
      await adminClient.from('user_audit_logs').insert({
        actor_id: currentUser.id,
        action_type: 'role.update',
        target_type: 'role',
        target_id: roleId,
        metadata: { name, description, previous_name: role?.name },
      })
    }

    revalidatePath('/admin/roles')
    revalidatePath(`/admin/roles/${roleId}`)

    return {
      success: true,
      message: 'Role updated successfully',
    }
  } catch (error) {
    console.error('Error in updateRoleAction:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Delete a role
 */
export async function deleteRoleAction(roleId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    const adminClient = await createAdminClient()

    // Check if this is a super admin or system role
    const { data: role } = await supabase
      .from('user_roles')
      .select('is_super_admin, is_system, name')
      .eq('id', roleId)
      .single()

    if (role?.is_super_admin) {
      return {
        success: false,
        error: 'Cannot delete Super Admin role',
      }
    }

    // Check if any users are assigned to this role
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role_id', roleId)
      .neq('status', 'deleted')

    if (count && count > 0) {
      return {
        success: false,
        error: `Cannot delete role. ${count} user(s) are still assigned to this role.`,
      }
    }

    // Delete role permissions first
    await adminClient.from('user_role_permissions').delete().eq('role_id', roleId)

    // Delete role
    const { error } = await adminClient.from('user_user_roles').delete().eq('id', roleId)

    if (error) {
      console.error('Error deleting role:', error)
      return {
        success: false,
        error: 'Failed to delete role',
      }
    }

    // Create audit log
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()

    if (currentUser) {
      await adminClient.from('user_audit_logs').insert({
        actor_id: currentUser.id,
        action_type: 'role.delete',
        target_type: 'role',
        target_id: roleId,
        metadata: { name: role?.name },
      })
    }

    revalidatePath('/admin/roles')

    return {
      success: true,
      message: 'Role deleted successfully',
    }
  } catch (error) {
    console.error('Error in deleteRoleAction:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Update role permissions (assign/unassign)
 */
export async function updateRolePermissionsAction(
  roleId: string,
  permissionKeys: string[]
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    const adminClient = await createAdminClient()

    // Check if this is a super admin role
    const { data: role } = await supabase
      .from('user_roles')
      .select('is_super_admin')
      .eq('id', roleId)
      .single()

    if (role?.is_super_admin) {
      return {
        success: false,
        error: 'Cannot modify Super Admin role permissions',
      }
    }

    // Get current permissions
    const { data: currentPerms } = await supabase
      .from('user_role_permissions')
      .select('permission_key')
      .eq('role_id', roleId)

    const currentKeys = new Set(currentPerms?.map((rp) => rp.permission_key) || [])
    const newKeys = new Set(permissionKeys)

    // Determine what to add and remove
    const toAdd = permissionKeys.filter((key) => !currentKeys.has(key))
    const toRemove = Array.from(currentKeys).filter((key) => !newKeys.has(key))

    // Remove old permissions
    if (toRemove.length > 0) {
      const { error: removeError } = await adminClient
        .from('user_role_permissions')
        .delete()
        .eq('role_id', roleId)
        .in('permission_key', toRemove)

      if (removeError) {
        console.error('Error removing permissions:', removeError)
        return {
          success: false,
          error: 'Failed to update permissions',
        }
      }
    }

    // Add new permissions
    if (toAdd.length > 0) {
      const { error: addError } = await adminClient.from('user_role_permissions').insert(
        toAdd.map((key) => ({
          role_id: roleId,
          permission_key: key,
        }))
      )

      if (addError) {
        console.error('Error adding permissions:', addError)
        return {
          success: false,
          error: 'Failed to update permissions',
        }
      }
    }

    // Create audit log
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()

    if (currentUser) {
      await adminClient.from('user_audit_logs').insert({
        actor_id: currentUser.id,
        action_type: 'role.permissions_update',
        target_type: 'role',
        target_id: roleId,
        metadata: {
          added: toAdd,
          removed: toRemove,
          total_permissions: permissionKeys.length,
        },
      })
    }

    revalidatePath('/admin/roles')
    revalidatePath(`/admin/roles/${roleId}`)

    return {
      success: true,
      message: 'Permissions updated successfully',
    }
  } catch (error) {
    console.error('Error in updateRolePermissionsAction:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}
