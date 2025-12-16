'use server'

import { createClient } from '@/lib/supabase/server'
import { verifySession } from '@/lib/dal'
import { revalidatePath } from 'next/cache'
import { createAuditLog } from '@/lib/audit'
import type { ActionResponse, AllowedDomain, AllowedDomainFormData } from '@/types'

/**
 * Get all allowed domains with pagination
 */
export async function getAllowedDomainsAction(params?: {
  page?: number
  limit?: number
  search?: string
}): Promise<ActionResponse<{ domains: AllowedDomain[]; total: number; pages: number }>> {
  try {
    await verifySession()
    const supabase = await createClient()

    const page = params?.page || 1
    const limit = params?.limit || 10
    const search = params?.search || ''
    const offset = (page - 1) * limit

    let query = supabase
      .from('public_allowed_domains')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (search) {
      query = query.or(`domain.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching allowed domains:', error)
      return {
        success: false,
        error: 'Failed to fetch allowed domains',
      }
    }

    return {
      success: true,
      data: {
        domains: data as AllowedDomain[],
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    }
  } catch (error) {
    console.error('Error in getAllowedDomainsAction:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Create a new allowed domain
 */
export async function createAllowedDomainAction(
  formData: AllowedDomainFormData
): Promise<ActionResponse<AllowedDomain>> {
  try {
    const user = await verifySession()
    const supabase = await createClient()

    // Validate domain format
    if (!formData.domain || formData.domain.trim() === '') {
      return { success: false, error: 'Domain is required' }
    }

    // Ensure domain starts with http:// or https://
    const domain = formData.domain.trim()
    if (!domain.startsWith('http://') && !domain.startsWith('https://')) {
      return {
        success: false,
        error: 'Domain must start with http:// or https://',
      }
    }

    // Check for duplicate domain
    const { data: existing } = await supabase
      .from('public_allowed_domains')
      .select('id')
      .eq('domain', domain)
      .single()

    if (existing) {
      return {
        success: false,
        error: 'This domain already exists',
      }
    }

    // Create domain
    const { data, error } = await supabase
      .from('public_allowed_domains')
      .insert({
        domain,
        description: formData.description?.trim() || null,
        is_active: formData.is_active,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating allowed domain:', error)
      return {
        success: false,
        error: 'Failed to create allowed domain',
      }
    }

    // Create audit log
    await createAuditLog({
      actorId: user.id,
      actionType: 'allowed_domain.created',
      targetType: 'allowed_domain',
      targetId: data.id,
      metadata: {
        domain: data.domain,
        is_active: data.is_active,
      },
    })

    revalidatePath('/admin/settings/allowed-domains')

    return {
      success: true,
      data: data as AllowedDomain,
      message: 'Allowed domain created successfully',
    }
  } catch (error) {
    console.error('Error in createAllowedDomainAction:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Update an allowed domain
 */
export async function updateAllowedDomainAction(
  domainId: string,
  formData: AllowedDomainFormData
): Promise<ActionResponse<AllowedDomain>> {
  try {
    const user = await verifySession()
    const supabase = await createClient()

    // Validate domain format
    if (!formData.domain || formData.domain.trim() === '') {
      return { success: false, error: 'Domain is required' }
    }

    const domain = formData.domain.trim()
    if (!domain.startsWith('http://') && !domain.startsWith('https://')) {
      return {
        success: false,
        error: 'Domain must start with http:// or https://',
      }
    }

    // Check for duplicate domain (excluding current)
    const { data: existing } = await supabase
      .from('public_allowed_domains')
      .select('id')
      .eq('domain', domain)
      .neq('id', domainId)
      .single()

    if (existing) {
      return {
        success: false,
        error: 'This domain already exists',
      }
    }

    // Update domain
    const { data, error } = await supabase
      .from('public_allowed_domains')
      .update({
        domain,
        description: formData.description?.trim() || null,
        is_active: formData.is_active,
        updated_by: user.id,
      })
      .eq('id', domainId)
      .select()
      .single()

    if (error) {
      console.error('Error updating allowed domain:', error)
      return {
        success: false,
        error: 'Failed to update allowed domain',
      }
    }

    // Create audit log
    await createAuditLog({
      actorId: user.id,
      actionType: 'allowed_domain.updated',
      targetType: 'allowed_domain',
      targetId: data.id,
      metadata: {
        domain: data.domain,
        is_active: data.is_active,
      },
    })

    revalidatePath('/admin/settings/allowed-domains')

    return {
      success: true,
      data: data as AllowedDomain,
      message: 'Allowed domain updated successfully',
    }
  } catch (error) {
    console.error('Error in updateAllowedDomainAction:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Delete an allowed domain
 */
export async function deleteAllowedDomainAction(domainId: string): Promise<ActionResponse<null>> {
  try {
    const user = await verifySession()
    const supabase = await createClient()

    // Get domain info for audit log
    const { data: domain } = await supabase
      .from('public_allowed_domains')
      .select('domain')
      .eq('id', domainId)
      .single()

    if (!domain) {
      return {
        success: false,
        error: 'Domain not found',
      }
    }

    // Delete domain
    const { error } = await supabase.from('public_allowed_domains').delete().eq('id', domainId)

    if (error) {
      console.error('Error deleting allowed domain:', error)
      return {
        success: false,
        error: 'Failed to delete allowed domain',
      }
    }

    // Create audit log
    await createAuditLog({
      actorId: user.id,
      actionType: 'allowed_domain.deleted',
      targetType: 'allowed_domain',
      targetId: domainId,
      metadata: {
        domain: domain.domain,
      },
    })

    revalidatePath('/admin/settings/allowed-domains')

    return {
      success: true,
      data: null,
      message: 'Allowed domain deleted successfully',
    }
  } catch (error) {
    console.error('Error in deleteAllowedDomainAction:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Toggle domain active status
 */
export async function toggleDomainStatusAction(
  domainId: string,
  isActive: boolean
): Promise<ActionResponse<AllowedDomain>> {
  try {
    const user = await verifySession()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('public_allowed_domains')
      .update({
        is_active: isActive,
        updated_by: user.id,
      })
      .eq('id', domainId)
      .select()
      .single()

    if (error) {
      console.error('Error toggling domain status:', error)
      return {
        success: false,
        error: 'Failed to update domain status',
      }
    }

    // Create audit log
    await createAuditLog({
      actorId: user.id,
      actionType: 'allowed_domain.status_changed',
      targetType: 'allowed_domain',
      targetId: data.id,
      metadata: {
        domain: data.domain,
        is_active: isActive,
      },
    })

    revalidatePath('/admin/settings/allowed-domains')

    return {
      success: true,
      data: data as AllowedDomain,
      message: `Domain ${isActive ? 'activated' : 'deactivated'} successfully`,
    }
  } catch (error) {
    console.error('Error in toggleDomainStatusAction:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}
