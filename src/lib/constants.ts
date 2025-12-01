/**
 * Application-wide constants
 */

// Brand Colors
export const COLORS = {
  MVM_BLUE: '#025fc7',
  MVM_YELLOW: '#ba9309',
} as const

// Application Metadata
export const APP_NAME = 'My Virtual Mate'
export const APP_TAGLINE = 'Your Virtual Companion Platform'
export const APP_DESCRIPTION =
  'An innovative platform connecting you with your perfect virtual companion. Coming soon!'

// User Status
export const USER_STATUS = {
  INVITED: 'invited',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DELETED: 'deleted',
} as const

// Routes
export const ROUTES = {
  HOME: '/',
  ADMIN_LOGIN: '/admin/login',
  ADMIN_DASHBOARD: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_ROLES: '/admin/roles',
} as const

// Pagination
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

// Session Configuration
export const SESSION_TIMEOUT_MINUTES = 60

// Blog Post Status
export const BLOG_POST_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  UNPUBLISHED: 'unpublished',
} as const

// Blog Routes
export const BLOG_ROUTES = {
  POSTS: '/admin/blog/posts',
  CATEGORIES: '/admin/blog/categories',
  CONTRIBUTORS: '/admin/blog/contributors',
} as const

// Blog Limits
export const BLOG_LIMITS = {
  SEO_TITLE_MAX_LENGTH: 60,
  SEO_DESCRIPTION_MAX_LENGTH: 160,
  EXPERTISE_MAX_COUNT: 3,
  STATS_MAX_COUNT: 3,
  READING_WORDS_PER_MINUTE: 200,
} as const
