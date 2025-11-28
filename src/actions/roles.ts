'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse } from '@/types'

/**
 * Get all roles for selection dropdowns
 */
export async function getRolesAction(): Promise<ActionResponse<any[]>> {
  try {
    const supabase = await createClient()

    const { data: roles, error } = await supabase
      .from('roles')
      .select('id, name, description, is_super_admin, is_system')
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
