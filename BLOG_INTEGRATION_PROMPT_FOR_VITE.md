# Blog Integration Guide for My Virtual Mate (React + Vite)

This document provides comprehensive instructions for integrating blog functionality into the React + Vite frontend at **https://myvirtualmate.com**.

---

## Table of Contents

1. [Overview](#overview)
2. [API Endpoints](#api-endpoints)
3. [Authentication & Security](#authentication--security)
4. [Data Models](#data-models)
5. [Blog Listing Page Requirements](#blog-listing-page-requirements)
6. [Blog Detail Page Requirements](#blog-detail-page-requirements)
7. [Preview Mode for Unpublished Blogs](#preview-mode-for-unpublished-blogs)
8. [Environment Configuration](#environment-configuration)
9. [Caching & Performance](#caching--performance)
10. [Error Handling](#error-handling)
11. [SEO Considerations](#seo-considerations)
12. [Implementation Checklist](#implementation-checklist)

---

## Overview

The blog backend provides two Supabase Edge Functions that expose blog post data to authorized domains:

- **Blog List API**: Fetch paginated list of published blogs
- **Blog Detail API**: Fetch a single blog post by slug

Both APIs are protected by domain-based access control and only return data to whitelisted domains configured in the admin panel.

---

## API Endpoints

### Base URL

Your Supabase project URL + `/functions/v1/`

Example: `https://your-project.supabase.co/functions/v1/`

### 1. Get Single Blog Post

**Endpoint**: `GET /blog-get-post`

**Query Parameters**:
- `slug` (required): URL slug of the blog post
- `preview` (optional): Set to `"true"` to include unpublished posts (for preview mode)

**Example Request**:
```javascript
const response = await fetch(
  `https://your-project.supabase.co/functions/v1/blog-get-post?slug=my-blog-post`,
  {
    headers: {
      'Origin': 'https://myvirtualmate.com'
    }
  }
)
const data = await response.json()
```

**Success Response** (200):
```json
{
  "id": "uuid",
  "title": "Blog Post Title",
  "slug": "blog-post-slug",
  "description": "Brief summary displayed below the title",
  "cover_image_url": "https://...",
  "content": "<p>Full HTML content...</p>",
  "reading_time": 5,
  "published_date": "2024-01-15T10:00:00Z",
  "status": "published",
  "created_at": "2024-01-10T09:00:00Z",
  "updated_at": "2024-01-15T09:30:00Z",
  "isPublished": true,
  "category": {
    "id": "uuid",
    "name": "Technology"
  },
  "contributor": {
    "id": "uuid",
    "full_name": "John Doe",
    "position": "Senior Writer",
    "avatar_url": "https://...",
    "bio": "John is a technology writer..."
  }
}
```

**Error Responses**:
- `400`: Missing slug parameter
- `403`: Domain not authorized
- `404`: Post not found or not published
- `500`: Internal server error

---

### 2. Get Blog Posts List

**Endpoint**: `GET /blog-list-posts`

**Query Parameters**:
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 10, max: 50): Number of posts per page
- `category_id` (optional): Filter by category UUID
- `contributor_id` (optional): Filter by contributor UUID
- `preview` (optional): Set to `"true"` to include unpublished posts

**Example Request**:
```javascript
const response = await fetch(
  `https://your-project.supabase.co/functions/v1/blog-list-posts?page=1&limit=10`,
  {
    headers: {
      'Origin': 'https://myvirtualmate.com'
    }
  }
)
const data = await response.json()
```

**Success Response** (200):
```json
{
  "posts": [
    {
      "id": "uuid",
      "title": "Blog Post Title",
      "slug": "blog-post-slug",
      "description": "Brief summary of the post",
      "cover_image_url": "https://...",
      "reading_time": 5,
      "published_date": "2024-01-15T10:00:00Z",
      "status": "published",
      "isPublished": true,
      "category": {
        "id": "uuid",
        "name": "Technology"
      },
      "contributor": {
        "id": "uuid",
        "full_name": "John Doe",
        "position": "Senior Writer",
        "avatar_url": "https://..."
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5
  }
}
```

**Note**: The list endpoint does **not** include the `content` field to optimize payload size. Fetch individual posts for full content.

---

## Authentication & Security

### Domain Whitelisting

The API uses Origin-based authentication. Your domain must be added to the allowed domains list in the admin panel.

**Current whitelisted domains**:
- `https://myvirtualmate.com` (production)
- `http://localhost:5173` (local development)

### CORS Headers

All requests must include the `Origin` header. Modern browsers send this automatically.

### Error Handling for Unauthorized Access

If your domain is not whitelisted, you'll receive:

```json
{
  "error": "Access denied. Domain not authorized.",
  "code": "DOMAIN_NOT_ALLOWED"
}
```

**Action**: Contact the backend admin to add your domain to the allowed list.

---

## Data Models

### BlogPost (Detail View)

```typescript
interface BlogPost {
  id: string
  title: string
  slug: string
  description: string | null
  cover_image_url: string | null
  content: string
  reading_time: number
  published_date: string | null
  status: 'draft' | 'published' | 'unpublished'
  created_at: string
  updated_at: string
  isPublished: boolean
  category: {
    id: string
    name: string
  } | null
  contributor: {
    id: string
    full_name: string
    position: string
    avatar_url: string | null
    bio: string
  } | null
}
```

### BlogPostListItem (List View)

```typescript
interface BlogPostListItem {
  id: string
  title: string
  slug: string
  description: string | null
  cover_image_url: string | null
  reading_time: number
  published_date: string | null
  status: string
  isPublished: boolean
  category: {
    id: string
    name: string
  } | null
  contributor: {
    id: string
    full_name: string
    position: string
    avatar_url: string | null
  } | null
}
```

### PaginatedResponse

```typescript
interface PaginatedBlogResponse {
  posts: BlogPostListItem[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}
```

---

## Blog Listing Page Requirements

Create a blog listing page at `/blog` or `/blogs` with the following features:

### Layout

- **Grid/Card Layout**: Display posts in a responsive grid (2-3 columns on desktop, 1 column on mobile)
- **Post Card**: Each card should include:
  - Cover image (with fallback if null)
  - Title
  - **Description** (displayed below the title)
  - Publication date
  - Reading time (e.g., "5 min read")
  - Category badge
  - Author info (name, avatar)
  - Click-through link to detail page

### Pagination

- Show current page and total pages
- Previous/Next buttons
- Optional: Page number buttons

### Filtering (Optional for v1)

- Filter by category
- Filter by contributor

### Example Component Structure

```jsx
<div className="blog-listing">
  <h1>Blog</h1>
  
  {/* Optional filters */}
  <div className="filters">...</div>
  
  {/* Posts grid */}
  <div className="posts-grid">
    {posts.map(post => (
      <BlogCard 
        key={post.id}
        post={post}
        onClick={() => navigate(`/blog/${post.slug}`)}
      />
    ))}
  </div>
  
  {/* Pagination */}
  <Pagination 
    current={page}
    total={pagination.pages}
    onChange={handlePageChange}
  />
</div>
```

---

## Blog Detail Page Requirements

Create a blog detail page at `/blog/:slug` with the following:

### Content Structure

1. **Header**:
   - Cover image (full-width or contained)
   - Title (H1)
   - **Description** (displayed immediately below title, styled as a lead paragraph)
   - Publication date
   - Reading time
   - Category badge

2. **Author Section**:
   - Avatar
   - Name and position
   - Bio

3. **Main Content**:
   - Rendered HTML content
   - Styled with appropriate typography

4. **Metadata** (for unpublished previews only):
   - Banner showing "Unpublished draft" or "Preview only – not live"

### SEO Meta Tags

Use the blog data to populate:

```html
<title>{post.seo_meta_title || post.title}</title>
<meta name="description" content={post.seo_meta_description || post.description} />
<meta property="og:title" content={post.title} />
<meta property="og:description" content={post.description} />
<meta property="og:image" content={post.cover_image_url} />
<meta property="og:url" content={`https://myvirtualmate.com/blog/${post.slug}`} />
<meta property="og:type" content="article" />
<meta name="twitter:card" content="summary_large_image" />
```

### Rendering HTML Content

The `content` field contains HTML. Render it safely:

```jsx
// Using dangerouslySetInnerHTML (ensure content is sanitized on backend)
<div 
  className="blog-content"
  dangerouslySetInnerHTML={{ __html: post.content }}
/>

// Or use a library like react-html-parser
import ReactHtmlParser from 'react-html-parser'

<div className="blog-content">
  {ReactHtmlParser(post.content)}
</div>
```

---

## Preview Mode for Unpublished Blogs

### Requirements

Admins need to preview unpublished blog posts exactly as they will appear when published.

### Implementation

1. **Preview Link**: Admin panel generates preview links like:
   ```
   https://myvirtualmate.com/blog/my-draft-post?preview=true
   ```

2. **Detect Preview Mode**:
   ```javascript
   const searchParams = new URLSearchParams(window.location.search)
   const isPreview = searchParams.get('preview') === 'true'
   ```

3. **Fetch with Preview Flag**:
   ```javascript
   const url = `${API_BASE}/blog-get-post?slug=${slug}${isPreview ? '&preview=true' : ''}`
   ```

4. **Display Preview Banner**:
   ```jsx
   {!post.isPublished && (
     <div className="preview-banner">
       ⚠️ Unpublished draft – Preview only
     </div>
   )}
   ```

5. **Same Layout as Published**:
   - Use the exact same component/layout for preview and published posts
   - Only difference: the banner when unpublished

---

## Environment Configuration

### Environment Variables

Create a `.env` file (or `.env.local` for Vite):

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Blog API
VITE_BLOG_API_BASE=https://your-project.supabase.co/functions/v1
```

### API Client Setup

```javascript
// src/services/blogApi.js

const API_BASE = import.meta.env.VITE_BLOG_API_BASE

export async function getBlogPost(slug, preview = false) {
  const url = new URL(`${API_BASE}/blog-get-post`)
  url.searchParams.set('slug', slug)
  if (preview) {
    url.searchParams.set('preview', 'true')
  }

  const response = await fetch(url.toString(), {
    headers: {
      'Origin': window.location.origin
    }
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch blog post')
  }

  return response.json()
}

export async function getBlogPosts(options = {}) {
  const { page = 1, limit = 10, categoryId, contributorId, preview = false } = options
  
  const url = new URL(`${API_BASE}/blog-list-posts`)
  url.searchParams.set('page', page.toString())
  url.searchParams.set('limit', limit.toString())
  
  if (categoryId) url.searchParams.set('category_id', categoryId)
  if (contributorId) url.searchParams.set('contributor_id', contributorId)
  if (preview) url.searchParams.set('preview', 'true')

  const response = await fetch(url.toString(), {
    headers: {
      'Origin': window.location.origin
    }
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch blog posts')
  }

  return response.json()
}
```

---

## Caching & Performance

### Recommended Approach: React Query

Install React Query (TanStack Query):

```bash
npm install @tanstack/react-query
```

#### Setup QueryClient

```javascript
// src/main.jsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
    </QueryClientProvider>
  )
}
```

#### Use in Components

```javascript
// Blog list page
import { useQuery } from '@tanstack/react-query'
import { getBlogPosts } from '@/services/blogApi'

function BlogListPage() {
  const [page, setPage] = useState(1)
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['blogs', page],
    queryFn: () => getBlogPosts({ page, limit: 10 }),
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      {data.posts.map(post => <BlogCard key={post.id} post={post} />)}
      <Pagination 
        current={page}
        total={data.pagination.pages}
        onChange={setPage}
      />
    </div>
  )
}
```

```javascript
// Blog detail page
import { useQuery } from '@tanstack/react-query'
import { useParams, useSearchParams } from 'react-router-dom'
import { getBlogPost } from '@/services/blogApi'

function BlogDetailPage() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const isPreview = searchParams.get('preview') === 'true'
  
  const { data: post, isLoading, error } = useQuery({
    queryKey: ['blog', slug, isPreview],
    queryFn: () => getBlogPost(slug, isPreview),
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <article>
      {!post.isPublished && (
        <div className="preview-banner">⚠️ Unpublished draft</div>
      )}
      
      <img src={post.cover_image_url} alt={post.title} />
      <h1>{post.title}</h1>
      <p className="description">{post.description}</p>
      
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  )
}
```

### Cache Invalidation

When admins publish new posts, they won't appear immediately due to caching. Options:

1. **Manual Refresh**: Users refresh the page
2. **Time-based**: Cache expires after 5-10 minutes
3. **Webhook (Advanced)**: Backend notifies frontend to invalidate cache

---

## Error Handling

### Common Errors

1. **Domain Not Authorized (403)**:
   - Display: "Unable to load blog content. Please contact support."
   - Action: Verify domain is whitelisted in admin panel

2. **Post Not Found (404)**:
   - Display: "Blog post not found"
   - Action: Redirect to blog list or show 404 page

3. **Network Errors**:
   - Display: "Failed to load blog. Please try again."
   - Action: Show retry button

### Example Error Component

```jsx
function BlogError({ error, retry }) {
  if (error.message.includes('DOMAIN_NOT_ALLOWED')) {
    return (
      <div className="error">
        <h2>Access Denied</h2>
        <p>This domain is not authorized to access blog content.</p>
      </div>
    )
  }

  return (
    <div className="error">
      <h2>Failed to Load Blog</h2>
      <p>{error.message}</p>
      <button onClick={retry}>Try Again</button>
    </div>
  )
}
```

---

## SEO Considerations

### Social Preview Route

A dedicated social preview route exists at the backend (`/blog/[slug]`) that:
- Provides rich meta tags for social media crawlers
- Redirects real users to `https://myvirtualmate.com/blog/[slug]`

You don't need to implement this in the Vite app—just ensure your blog detail pages have proper meta tags.

### Canonical URLs

Always set canonical URLs:

```html
<link rel="canonical" href={`https://myvirtualmate.com/blog/${post.slug}`} />
```

### Structured Data

Consider adding JSON-LD structured data:

```jsx
<script type="application/ld+json">
  {JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.description,
    "image": post.cover_image_url,
    "datePublished": post.published_date,
    "author": {
      "@type": "Person",
      "name": post.contributor?.full_name
    }
  })}
</script>
```

---

## Implementation Checklist

### Setup
- [ ] Install dependencies: `@tanstack/react-query`
- [ ] Configure environment variables
- [ ] Create API client (`src/services/blogApi.js`)
- [ ] Set up React Query provider

### Blog List Page
- [ ] Create `/blog` route
- [ ] Implement blog card component
- [ ] Add pagination
- [ ] Handle loading and error states
- [ ] Add filtering (optional)

### Blog Detail Page
- [ ] Create `/blog/:slug` route
- [ ] Render cover image, title, **description**, and content
- [ ] Display author info
- [ ] Add SEO meta tags
- [ ] Handle 404 for missing posts

### Preview Mode
- [ ] Detect `?preview=true` query parameter
- [ ] Pass preview flag to API
- [ ] Show "Unpublished draft" banner
- [ ] Use same layout as published posts

### Polish
- [ ] Add responsive design
- [ ] Style blog content HTML
- [ ] Add loading skeletons
- [ ] Test error scenarios
- [ ] Verify SEO meta tags
- [ ] Test on staging domain first

---

## Summary

You now have everything needed to integrate blogs into the My Virtual Mate frontend:

1. **Two API endpoints**: One for lists, one for detail
2. **Domain security**: Origin-based whitelisting
3. **Data models**: Clear TypeScript interfaces
4. **Description field**: Displayed below title on both list and detail views
5. **Preview mode**: For viewing unpublished drafts
6. **Caching strategy**: React Query with sensible defaults
7. **SEO support**: Meta tags and structured data

**Next Steps**:
1. Set up environment variables
2. Implement the blog list page
3. Implement the blog detail page
4. Add preview mode support
5. Test thoroughly on staging before production

For questions or issues, contact the backend team or refer to the admin panel documentation.
