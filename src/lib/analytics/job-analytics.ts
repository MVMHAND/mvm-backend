/**
 * Google Analytics 4 utility functions for job posts analytics
 */

import { CONTENT_TYPE_CONFIG } from '@/lib/urls/content-urls'

const GA4_BASE_URL = 'https://analytics.google.com/analytics/web'
const GA4_PROPERTY_ID = 'a362325118p497821772'

/**
 * Generates a Google Analytics reports URL filtered by job post page path
 * @param jobId - The job ID (e.g., "JOB-000001")
 * @returns The GA4 reports URL with page path filter applied
 */
export function getJobPostAnalyticsUrl(jobId: string): string {
  if (!jobId) {
    return ''
  }

  // Use centralized path template from content-urls.ts
  const pagePath = CONTENT_TYPE_CONFIG.job.pathTemplate.replace('{jobId}', jobId)

  const comparison = {
    name: `Page path and screen class exactly matches ${pagePath}`,
    isEnabled: true,
    filters: [
      {
        fieldName: 'unifiedPagePathScreen',
        expressionList: [pagePath],
        isCaseSensitive: true,
      },
    ],
  }

  const comparisonsParam = encodeURIComponent(JSON.stringify([comparison]))

  return `${GA4_BASE_URL}/#/${GA4_PROPERTY_ID}/reports/reportinghub?params=_u..nav=maui&_u..built_comparisons_enabled=true&_u..comparisons=${comparisonsParam}`
}

/**
 * Returns the URL for the overview analytics dashboard showing all job posts combined
 */
export function getJobPostsOverviewAnalyticsUrl(): string {
  // Extract base path from centralized config
  const basePath = CONTENT_TYPE_CONFIG.job.pathTemplate.split('{')[0] // e.g., '/careers/'
  
  const comparison = {
    name: `Page path and screen class contains ${basePath}`,
    isEnabled: true,
    filters: [
      {
        fieldName: 'unifiedPagePathScreen',
        evaluationType: 3,
        expressionList: [basePath],
        isCaseSensitive: true,
      },
    ],
  }

  const comparisonsParam = encodeURIComponent(JSON.stringify([comparison]))

  return `${GA4_BASE_URL}/#/${GA4_PROPERTY_ID}/reports/reportinghub?params=_u..nav=maui&_u..built_comparisons_enabled=true&_u..comparisons=${comparisonsParam}`
}
