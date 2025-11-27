# Next.js Blog Project - Technical Specifications

## Tech Stack

### Core Framework

- **Next.js**: Version 15 (latest)
- **React**: Version 19 (latest)
- **TypeScript**: Strict mode enabled
- **Node.js**: Version 18 or higher

### Routing

- **Next.js App Router**: File-system based routing in `app/` directory
- All components are Server Components by default
- Client Components require explicit `"use client"` directive

### State Management

- **Zustand**: For client-side UI state only
- **React Context**: For authentication state only
- **Server Components**: For server data (no state management)

### Backend & Database

- **Supabase PostgreSQL**: Database
- **Supabase Auth**: Authentication
- **Supabase Storage**: File storage
- **Server Components**: Direct database queries
- **Server Actions**: Data mutations

### Styling

- **Tailwind CSS**: Utility-first CSS framework
- Global styles in `app/globals.css` only
- CSS Modules for component-specific styles when needed

### Deployment

- **Vercel**: Primary hosting platform
- **GitHub**: Version control and CI/CD trigger

## Project Structure

```

my-blog/
├── src/
│ ├── app/
│ │ ├── layout.tsx
│ │ ├── page.tsx
│ │ ├── globals.css
│ │ ├── (marketing)/
│ │ │ ├── about/
│ │ │ │ └── page.tsx
│ │ │ └── contact/
│ │ │ └── page.tsx
│ │ ├── blog/
│ │ │ ├── page.tsx
│ │ │ ├── loading.tsx
│ │ │ └── [slug]/
│ │ │ ├── page.tsx
│ │ │ ├── loading.tsx
│ │ │ └── error.tsx
│ │ └── admin/
│ │ ├── layout.tsx
│ │ ├── page.tsx
│ │ └── posts/
│ │ ├── new/
│ │ │ └── page.tsx
│ │ └── [id]/
│ │ └── page.tsx
│ ├── components/
│ │ ├── ui/
│ │ ├── layout/
│ │ └── features/
│ │ ├── auth/
│ │ └── blog/
│ ├── lib/
│ │ ├── supabase/
│ │ │ ├── client.ts
│ │ │ ├── server.ts
│ │ │ └── middleware.ts
│ │ ├── utils.ts
│ │ └── constants.ts
│ ├── hooks/
│ ├── types/
│ │ ├── database.ts
│ │ └── index.ts
│ ├── actions/
│ │ ├── posts.ts
│ │ └── comments.ts
│ └── stores/
│ └── useUIStore.ts
├── public/
│ ├── images/
│ └── fonts/
├── middleware.ts
├── .env.local
├── .eslintrc.json
├── .prettierrc
├── .prettierignore
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json

```

## Coding Standards

### File Naming Conventions

#### Components

- React components: PascalCase (e.g., `BlogPost.tsx`, `CommentForm.tsx`)
- Non-component files: camelCase (e.g., `utils.ts`, `formatDate.ts`)
- Page files: lowercase (e.g., `page.tsx`, `layout.tsx`, `error.tsx`)
- Route folders: lowercase with hyphens (e.g., `[slug]`, `admin-dashboard`)

#### Constants

- File: camelCase (e.g., `constants.ts`)
- Variables: SCREAMING_SNAKE_CASE (e.g., `API_URL`, `MAX_FILE_SIZE`)

### TypeScript Rules

#### Type Definitions

```

// Use interfaces for objects
interface Post {
id: string
title: string
content: string
slug: string
published_at: string
}

// Use types for unions, intersections, primitives
type PostStatus = 'draft' | 'published' | 'archived'
type UserRole = 'admin' | 'editor' | 'viewer'

// Export types from centralized location
// src/types/index.ts
export type { Post, Comment, User }
export type { PostStatus, UserRole }

```

#### Function Signatures

```

// Explicit return types for all functions
async function fetchPost(slug: string): Promise<Post | null> {
// implementation
}

// Arrow functions with explicit types
const formatDate = (date: string): string => {
// implementation
}

// Server Actions must be async
async function createPost(formData: FormData): Promise<{ success: boolean }> {
"use server"
// implementation
}

```

#### No Any Types

```

// ❌ Never use 'any'
function processData(data: any) { }

// ✅ Use proper types or unknown
function processData(data: unknown) {
if (typeof data === 'string') {
// type-safe handling
}
}

```

### Component Structure

#### Server Components (Default)

```

// app/blog/[slug]/page.tsx
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

interface PageProps {
params: { slug: string }
searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
const supabase = createClient()
const { data: post } = await supabase
.from('posts')
.select('title, excerpt, cover_image')
.eq('slug', params.slug)
.single()

return {
title: `${post.title} | My Blog`,
description: post.excerpt,
openGraph: {
title: post.title,
description: post.excerpt,
images: [{ url: post.cover_image }],
type: 'article',
},
twitter: {
card: 'summary_large_image',
title: post.title,
description: post.excerpt,
images: [post.cover_image],
},
}
}

export default async function BlogPostPage({ params }: PageProps) {
const supabase = createClient()
const { data: post } = await supabase
.from('posts')
.select('\*')
.eq('slug', params.slug)
.single()

if (!post) {
notFound()
}

return (
<article className="max-w-4xl mx-auto py-8">
<h1 className="text-4xl font-bold mb-4">{post.title}</h1>
<div dangerouslySetInnerHTML={{ __html: post.content }} />
</article>
)
}

```

#### Client Components

```

// components/features/blog/CommentForm.tsx
"use client"

import { useState } from 'react'
import { submitComment } from '@/actions/comments'
import type { FormEvent } from 'react'

interface CommentFormProps {
postId: string
}

export function CommentForm({ postId }: CommentFormProps) {
const [comment, setComment] = useState<string>('')
const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

async function handleSubmit(e: FormEvent<HTMLFormElement>) {
e.preventDefault()
setIsSubmitting(true)

    const formData = new FormData()
    formData.append('comment', comment)
    formData.append('postId', postId)

    await submitComment(formData)

    setComment('')
    setIsSubmitting(false)

}

return (
<form onSubmit={handleSubmit} className="space-y-4">
<textarea
value={comment}
onChange={(e) => setComment(e.target.value)}
className="w-full p-2 border rounded"
placeholder="Write a comment..."
required
/>
<button
        type="submit"
        disabled={isSubmitting}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
{isSubmitting ? 'Submitting...' : 'Submit'}
</button>
</form>
)
}

```

### Server Actions

```

// actions/posts.ts
"use server"

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Post } from '@/types'

export async function createPost(formData: FormData): Promise<{ success: boolean; error?: string }> {
const supabase = createClient()

const title = formData.get('title') as string
const content = formData.get('content') as string
const slug = title.toLowerCase().replace(/\s+/g, '-')

const { data, error } = await supabase
.from('posts')
.insert({
title,
content,
slug,
published_at: new Date().toISOString(),
})
.select()
.single()

if (error) {
return { success: false, error: error.message }
}

revalidatePath('/blog')
redirect(`/blog/${slug}`)
}

export async function updatePost(id: string, formData: FormData): Promise<{ success: boolean }> {
const supabase = createClient()

const { error } = await supabase
.from('posts')
.update({
title: formData.get('title') as string,
content: formData.get('content') as string,
})
.eq('id', id)

if (error) {
return { success: false }
}

revalidatePath('/blog')
revalidatePath(`/blog/[slug]`)

return { success: true }
}

export async function deletePost(id: string): Promise<{ success: boolean }> {
const supabase = createClient()

const { error } = await supabase
.from('posts')
.delete()
.eq('id', id)

if (error) {
return { success: false }
}

revalidatePath('/blog')

return { success: true }
}

```

### Supabase Client Configuration

#### Server Client

```

// lib/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
const cookieStore = cookies()

return createServerClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
{
cookies: {
get(name: string) {
return cookieStore.get(name)?.value
},
set(name: string, value: string, options: CookieOptions) {
try {
cookieStore.set({ name, value, ...options })
} catch (error) {
// Handle cookie set error
}
},
remove(name: string, options: CookieOptions) {
try {
cookieStore.set({ name, value: '', ...options })
} catch (error) {
// Handle cookie remove error
}
},
},
}
)
}

```

#### Browser Client

```

// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
return createBrowserClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
}

```

#### Middleware Client

```

// lib/supabase/middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export function createClient(request: NextRequest) {
let response = NextResponse.next({
request: {
headers: request.headers,
},
})

const supabase = createServerClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
{
cookies: {
get(name: string) {
return request.cookies.get(name)?.value
},
set(name: string, value: string, options: CookieOptions) {
request.cookies.set({
name,
value,
...options,
})
response = NextResponse.next({
request: {
headers: request.headers,
},
})
response.cookies.set({
name,
value,
...options,
})
},
remove(name: string, options: CookieOptions) {
request.cookies.set({
name,
value: '',
...options,
})
response = NextResponse.next({
request: {
headers: request.headers,
},
})
response.cookies.set({
name,
value: '',
...options,
})
},
},
}
)

return { supabase, response }
}

```

### Zustand Store Pattern

```

// stores/useUIStore.ts
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface UIState {
sidebarOpen: boolean
theme: 'light' | 'dark'
toggleSidebar: () => void
setTheme: (theme: 'light' | 'dark') => void
}

export const useUIStore = create<UIState>()(
devtools(
persist(
(set) => ({
sidebarOpen: false,
theme: 'light',
toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
setTheme: (theme) => set({ theme }),
}),
{
name: 'ui-storage',
}
)
)
)

```

### Utility Functions

```

// lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
return twMerge(clsx(inputs))
}

export function formatDate(date: string): string {
return new Date(date).toLocaleDateString('en-US', {
year: 'numeric',
month: 'long',
day: 'numeric',
})
}

export function slugify(text: string): string {
return text
.toLowerCase()
.trim()
.replace(/[^\w\s-]/g, '')
.replace(/[\s_-]+/g, '-')
.replace(/^-+|-+$/g, '')
}

export function truncate(text: string, length: number): string {
if (text.length <= length) return text
return text.slice(0, length).trim() + '...'
}

```

### Image Optimization

```

import Image from 'next/image'

// Always use Next.js Image component
<Image
  src={post.cover_image}
  alt={post.title}
  width={1200}
  height={630}
  priority={false}
  className="w-full h-auto"
/>

// For external images from Supabase
<Image
  src={post.cover_image}
  alt={post.title}
  width={1200}
  height={630}
  unoptimized={false}
/>

```

### Error Handling

```

// app/blog/[slug]/error.tsx
"use client"

import { useEffect } from 'react'

interface ErrorProps {
error: Error & { digest?: string }
reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
useEffect(() => {
console.error(error)
}, [error])

return (
<div className="flex min-h-screen flex-col items-center justify-center">
<h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
<button
onClick={() => reset()}
className="px-4 py-2 bg-blue-600 text-white rounded" >
Try again
</button>
</div>
)
}

```

### Loading States

```

// app/blog/[slug]/loading.tsx
export default function Loading() {
return (
<div className="max-w-4xl mx-auto py-8">
<div className="animate-pulse">
<div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
<div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
<div className="space-y-3">
<div className="h-4 bg-gray-200 rounded"></div>
<div className="h-4 bg-gray-200 rounded"></div>
<div className="h-4 bg-gray-200 rounded w-5/6"></div>
</div>
</div>
</div>
)
}

```

## Configuration Files

### package.json

```

{
"name": "my-blog",
"version": "1.0.0",
"private": true,
"scripts": {
"dev": "next dev",
"build": "next build",
"start": "next start",
"lint": "next lint",
"format": "prettier --write \"**/\*.{ts,tsx,js,jsx,json,md,css}\"",
"format:check": "prettier --check \"**/\*.{ts,tsx,js,jsx,json,md,css}\"",
"type-check": "tsc --noEmit"
},
"dependencies": {
"next": "^15.0.0",
"react": "^19.0.0",
"react-dom": "^19.0.0",
"@supabase/ssr": "latest",
"@supabase/supabase-js": "latest",
"zustand": "^4.5.0",
"clsx": "^2.1.0",
"tailwind-merge": "^2.2.0"
},
"devDependencies": {
"@types/node": "^20",
"@types/react": "^18",
"@types/react-dom": "^18",
"typescript": "^5",
"eslint": "^8",
"eslint-config-next": "^15.0.0",
"prettier": "^3.2.0",
"prettier-plugin-tailwindcss": "^0.5.0",
"tailwindcss": "^3.4.0",
"postcss": "^8",
"autoprefixer": "^10"
}
}

```

### tsconfig.json

```

{
"compilerOptions": {
"target": "ES2020",
"lib": ["dom", "dom.iterable", "esnext"],
"allowJs": true,
"skipLibCheck": true,
"strict": true,
"noEmit": true,
"esModuleInterop": true,
"module": "esnext",
"moduleResolution": "bundler",
"resolveJsonModule": true,
"isolatedModules": true,
"jsx": "preserve",
"incremental": true,
"plugins": [
{
"name": "next"
}
],
"paths": {
"@/_": ["./src/_"]
},
"forceConsistentCasingInFileNames": true,
"noUnusedLocals": true,
"noUnusedParameters": true,
"noFallthroughCasesInSwitch": true
},
"include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
"exclude": ["node_modules"]
}

```

### .prettierrc

```

{
"semi": false,
"trailingComma": "es5",
"singleQuote": true,
"tabWidth": 2,
"useTabs": false,
"printWidth": 100,
"arrowParens": "always",
"endOfLine": "lf",
"plugins": ["prettier-plugin-tailwindcss"]
}

```

### .prettierignore

```

node_modules
.next
out
dist
build
coverage
.vercel
.env\*
package-lock.json
yarn.lock
pnpm-lock.yaml

```

### .eslintrc.json

```

{
"extends": [
"next/core-web-vitals",
"next/typescript"
],
"rules": {
"react/no-unescaped-entities": "off",
"@typescript-eslint/no-unused-vars": [
"error",
{
"argsIgnorePattern": "^_",
"varsIgnorePattern": "^_"
}
],
"@typescript-eslint/no-explicit-any": "error",
"prefer-const": "error",
"no-var": "error"
}
}

```

### next.config.js

```

/** @type {import('next').NextConfig} \*/
const nextConfig = {
images: {
remotePatterns: [
{
protocol: 'https',
hostname: '**.supabase.co',
port: '',
pathname: '/storage/v1/object/public/\*\*',
},
],
},
experimental: {
typedRoutes: true,
},
}

module.exports = nextConfig

```

### tailwind.config.ts

```

import type { Config } from 'tailwindcss'

const config: Config = {
content: [
'./src/pages/**/*.{js,ts,jsx,tsx,mdx}',
'./src/components/**/*.{js,ts,jsx,tsx,mdx}',
'./src/app/**/*.{js,ts,jsx,tsx,mdx}',
],
theme: {
extend: {
colors: {
background: 'var(--background)',
foreground: 'var(--foreground)',
},
},
},
plugins: [],
}

export default config

```

### middleware.ts

```

import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
const { supabase, response } = createClient(request)

const {
data: { session },
} = await supabase.auth.getSession()

if (request.nextUrl.pathname.startsWith('/admin') && !session) {
const redirectUrl = request.nextUrl.clone()
redirectUrl.pathname = '/login'
return NextResponse.redirect(redirectUrl)
}

return response
}

export const config = {
matcher: [
'/admin/:path*',
'/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
],
}

```

### .env.local

```

# Supabase

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Site

NEXT_PUBLIC_SITE_URL=https://yourblog.com

```

### .gitignore

```

# Dependencies

node_modules
.pnp
.pnp.js

# Testing

coverage

# Next.js

.next/
out/
build
dist

# Misc

.DS_Store
\*.pem

# Debug

npm-debug.log*
yarn-debug.log*
yarn-error.log\*

# Local env files

.env\*.local

# Vercel

.vercel

# TypeScript

\*.tsbuildinfo
next-env.d.ts

```

## Code Quality Enforcement

### Pre-commit Hook Setup

```

npm install --save-dev husky lint-staged
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"

```

### lint-staged Configuration

Add to package.json:

```

{
"lint-staged": {
"_.{ts,tsx}": [
"eslint --fix",
"prettier --write"
],
"_.{json,md,css}": [
"prettier --write"
]
}
}

```

## Import Order Convention

```

// 1. React imports
import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'

// 2. Next.js imports
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

// 3. Third-party libraries
import { create } from 'zustand'
import { clsx } from 'clsx'

// 4. Internal imports (absolute paths with @/)
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/utils'
import type { Post } from '@/types'

// 5. Relative imports (only for co-located files)
import { PostCard } from './PostCard'

```

## Comment Standards

### File Headers

```

/\*\*

- Blog post page component
- Displays individual blog post with dynamic metadata for SEO
-
- @route /blog/[slug]
  \*/

```

### Function Documentation

```

/\*\*

- Fetches a single blog post by slug
-
- @param slug - URL-friendly post identifier
- @returns Post object or null if not found
  \*/
  async function fetchPost(slug: string): Promise<Post | null> {
  // implementation
  }

```

### Complex Logic Comments

```

// Calculate reading time based on word count (average 200 words per minute)
const readingTime = Math.ceil(wordCount / 200)

```

## Naming Conventions

### Variables

```

// camelCase for variables and functions
const blogPost = await fetchPost()
const userProfile = getUserProfile()

// PascalCase for components and types
const BlogPost = () => {}
type PostStatus = 'draft' | 'published'

// SCREAMING_SNAKE_CASE for constants
const MAX_TITLE_LENGTH = 100
const API_BASE_URL = 'https://api.example.com'

```

### Boolean Variables

```

// Prefix with 'is', 'has', 'should', 'can'
const isLoading = true
const hasPermission = false
const shouldRedirect = true
const canEdit = false

```

### Event Handlers

```

// Prefix with 'handle' or 'on'
function handleSubmit(e: FormEvent) {}
function onUserClick() {}
const handleFormChange = () => {}

```

## Performance Best Practices

### Image Loading

```

// Use priority for above-the-fold images
<Image src={hero} alt="Hero" priority />

// Use lazy loading for below-the-fold
<Image src={thumbnail} alt="Post" loading="lazy" />

```

### Dynamic Imports

```

// For heavy client-side libraries
import dynamic from 'next/dynamic'

const ChartComponent = dynamic(() => import('@/components/Chart'), {
ssr: false,
loading: () => <div>Loading chart...</div>,
})

```

### Caching Strategy

```

// Page-level revalidation
export const revalidate = 3600 // 1 hour

// On-demand revalidation in Server Actions
revalidatePath('/blog')
revalidateTag('posts')

```

## Accessibility Standards

### Semantic HTML

```

// Use proper semantic elements

<article>
  <header>
    <h1>{post.title}</h1>
    <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
  </header>
  <main>{post.content}</main>
  <footer>
    <nav aria-label="Post navigation">
      <Link href="/blog">Back to posts</Link>
    </nav>
  </footer>
</article>
```

### ARIA Labels

```
<button
  onClick={toggleSidebar}
  aria-label="Toggle navigation menu"
  aria-expanded={sidebarOpen}
>
  <MenuIcon />
</button>
```

### Alt Text

```
// Descriptive alt text for all images
<Image
  src={post.cover_image}
  alt={`Cover image for ${post.title}`}
  width={1200}
  height={630}
/>
```

## Git Commit Convention

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding tests
- `chore`: Build process or auxiliary tool changes

### Examples

```
feat(blog): add social media sharing buttons
fix(auth): resolve login redirect loop
docs(readme): update installation instructions
refactor(posts): extract PostCard component
perf(images): optimize cover image loading
```

## Deployment Checklist

### Environment Variables (Vercel Dashboard)

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL
```

### Build Configuration

- Node.js Version: 18.x or higher
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

### Pre-deployment Validation

```
# Type checking
npm run type-check

# Linting
npm run lint

# Format checking
npm run format:check

# Production build test
npm run build
npm run start
```
