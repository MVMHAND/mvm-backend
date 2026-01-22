/**
 * Centralized URL generation for all content types
 * Supports multiple production domains and dynamic preview URLs
 */

type ContentType = 'blog' | 'job'
type ContentStatus = 'draft' | 'published' | 'unpublished'

interface UrlGenerationConfig {
  mainSiteUrls: string[]
  previewUrl: string
  adminUrl: string
}

interface ContentTypeConfig {
  pathTemplate: string
  identifierKey: 'slug' | 'jobId' | 'id'
  hasSocialPreview: boolean
}

const CONTENT_TYPE_CONFIG: Record<ContentType, ContentTypeConfig> = {
  blog: {
    pathTemplate: '/blog/{slug}',
    identifierKey: 'slug',
    hasSocialPreview: true,
  },
  job: {
    pathTemplate: '/careers/{jobId}',
    identifierKey: 'jobId',
    hasSocialPreview: false,
  },
}

interface BlogUrlParams {
  type: 'blog'
  slug: string
  status: ContentStatus
}

interface JobUrlParams {
  type: 'job'
  jobId: string
  status: ContentStatus
}

type ContentUrlParams = BlogUrlParams | JobUrlParams

/**
 * Parse MAIN_SITE_URLS from env (handles array or string)
 */
export function getMainSiteUrls(): string[] {
  const mainSiteUrls = process.env.MAIN_SITE_URLS
  if (!mainSiteUrls) return []

  try {
    const parsed = JSON.parse(mainSiteUrls)
    return Array.isArray(parsed) ? parsed : [parsed]
  } catch {
    return [mainSiteUrls]
  }
}

/**
 * Get configuration from environment
 */
export function getUrlConfig(): UrlGenerationConfig {
  return {
    mainSiteUrls: getMainSiteUrls(),
    previewUrl: process.env.PREVIEW_URL || '',
    adminUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  }
}

/**
 * Generate content path from template and params
 */
function generateContentPath(params: ContentUrlParams): string {
  const config = CONTENT_TYPE_CONFIG[params.type]

  if (params.type === 'blog') {
    return config.pathTemplate.replace(`{${config.identifierKey}}`, params.slug)
  } else {
    return config.pathTemplate.replace(`{${config.identifierKey}}`, params.jobId)
  }
}

/**
 * Generate preview URL with ?preview=true for unpublished content
 */
function generatePreviewUrl(baseUrl: string, path: string, status: ContentStatus): string {
  const url = `${baseUrl}${path}`
  if (status === 'published') return url
  return url + (url.includes('?') ? '&' : '?') + 'preview=true'
}

interface ContentUrls {
  previewUrl: string
  socialPreviewUrl: string | null
  productionUrls: {
    primary: string | null
    alternates: string[]
  }
}

/**
 * Generate all URLs for content
 */
export function generateContentUrls(params: ContentUrlParams): ContentUrls {
  const config = getUrlConfig()
  const typeConfig = CONTENT_TYPE_CONFIG[params.type]
  const contentPath = generateContentPath(params)

  // Preview URL (always available)
  const previewUrl = generatePreviewUrl(config.previewUrl, contentPath, params.status)

  // Social preview URL (admin panel URL for crawler detection)
  const socialPreviewUrl =
    typeConfig.hasSocialPreview && params.status === 'published'
      ? `${config.adminUrl}${contentPath}`
      : null

  // Production URLs (only for published)
  const productionUrls =
    params.status === 'published'
      ? config.mainSiteUrls.map((siteUrl) => `${siteUrl}${contentPath}`)
      : []

  return {
    previewUrl,
    socialPreviewUrl,
    productionUrls: {
      primary: productionUrls[0] || null,
      alternates: productionUrls.slice(1),
    },
  }
}

/**
 * Convenience function for blog URLs
 */
export function generateBlogUrls(slug: string, status: ContentStatus): ContentUrls {
  return generateContentUrls({ type: 'blog', slug, status })
}

/**
 * Convenience function for job URLs
 */
export function generateJobUrls(jobId: string, status: ContentStatus): ContentUrls {
  return generateContentUrls({ type: 'job', jobId, status })
}

/**
 * Helper to get primary production URL (for backwards compatibility)
 */
export function getPrimaryProductionUrl(params: ContentUrlParams): string | null {
  const urls = generateContentUrls(params)
  return urls.productionUrls.primary
}
