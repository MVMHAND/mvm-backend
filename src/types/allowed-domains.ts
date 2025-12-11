/**
 * Allowed domains type definitions
 * Types for managing domains allowed to access public blog API
 */

export interface AllowedDomain {
  id: string
  domain: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export interface AllowedDomainWithUsers extends AllowedDomain {
  creator?: {
    name: string
    email: string
  }
  updater?: {
    name: string
    email: string
  }
}

export interface AllowedDomainFormData {
  domain: string
  description: string
  is_active: boolean
}
