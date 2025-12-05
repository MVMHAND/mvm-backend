/**
 * Blog storage utility functions
 * Handles image uploads to Supabase Storage
 */

import { createClient } from '@/lib/supabase/server'

// Allowed image types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

// Maximum file sizes
const MAX_COVER_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_AVATAR_SIZE = 2 * 1024 * 1024 // 2MB

/**
 * Validate image file
 */
export function validateImageFile(
  file: File,
  maxSize: number
): {
  isValid: boolean
  error?: string
} {
  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: 'Invalid file type. Only JPG, PNG, and WebP are allowed.',
    }
  }
  
  // Check file size
  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024)
    return {
      isValid: false,
      error: `File size exceeds ${maxSizeMB}MB limit.`,
    }
  }
  
  return { isValid: true }
}

/**
 * Upload blog cover image
 */
export async function uploadBlogCover(
  file: File,
  postId: string
): Promise<{
  success: boolean
  url?: string
  error?: string
}> {
  // Validate file
  const validation = validateImageFile(file, MAX_COVER_IMAGE_SIZE)
  if (!validation.isValid) {
    return { success: false, error: validation.error }
  }
  
  const supabase = await createClient()
  
  // Generate unique filename
  const fileExt = file.name.split('.').pop()
  const fileName = `${postId}-${Date.now()}.${fileExt}`
  const filePath = `covers/${fileName}`
  
  // Upload file
  const { error: uploadError } = await supabase.storage
    .from('blog-cover-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })
  
  if (uploadError) {
    return { success: false, error: uploadError.message }
  }
  
  // Get public URL
  const { data: urlData } = supabase.storage
    .from('blog-cover-images')
    .getPublicUrl(filePath)
  
  return {
    success: true,
    url: urlData.publicUrl,
  }
}

/**
 * Upload contributor avatar
 */
export async function uploadContributorAvatar(
  file: File,
  contributorId: string
): Promise<{
  success: boolean
  url?: string
  error?: string
}> {
  // Validate file
  const validation = validateImageFile(file, MAX_AVATAR_SIZE)
  if (!validation.isValid) {
    return { success: false, error: validation.error }
  }
  
  const supabase = await createClient()
  
  // Generate unique filename
  const fileExt = file.name.split('.').pop()
  const fileName = `${contributorId}-${Date.now()}.${fileExt}`
  const filePath = `avatars/${fileName}`
  
  // Upload file
  const { error: uploadError } = await supabase.storage
    .from('blog-contributor-avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })
  
  if (uploadError) {
    return { success: false, error: uploadError.message }
  }
  
  // Get public URL
  const { data: urlData } = supabase.storage
    .from('blog-contributor-avatars')
    .getPublicUrl(filePath)
  
  return {
    success: true,
    url: urlData.publicUrl,
  }
}

/**
 * Delete blog cover image
 */
export async function deleteBlogCover(url: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = await createClient()
    
    // Extract file path from URL
    const urlParts = url.split('/blog-cover-images/')
    if (urlParts.length < 2) {
      return { success: false, error: 'Invalid URL format' }
    }
    
    const filePath = urlParts[1]
    
    const { error } = await supabase.storage
      .from('blog-cover-images')
      .remove([filePath])
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Delete contributor avatar
 */
export async function deleteContributorAvatar(url: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = await createClient()
    
    // Extract file path from URL
    const urlParts = url.split('/blog-contributor-avatars/')
    if (urlParts.length < 2) {
      return { success: false, error: 'Invalid URL format' }
    }
    
    const filePath = urlParts[1]
    
    const { error } = await supabase.storage
      .from('blog-contributor-avatars')
      .remove([filePath])
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get public URL for a storage file
 */
export async function getPublicUrl(bucket: string, path: string): Promise<string> {
  const supabase = await createClient()
  
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)
  
  return data.publicUrl
}

/**
 * Get file size limits for display
 */
export function getFileSizeLimits(): {
  cover: { bytes: number; display: string }
  avatar: { bytes: number; display: string }
} {
  return {
    cover: {
      bytes: MAX_COVER_IMAGE_SIZE,
      display: '5MB',
    },
    avatar: {
      bytes: MAX_AVATAR_SIZE,
      display: '2MB',
    },
  }
}

/**
 * Get allowed file types for display
 */
export function getAllowedFileTypes(): string[] {
  return ['JPG', 'PNG', 'WebP']
}
