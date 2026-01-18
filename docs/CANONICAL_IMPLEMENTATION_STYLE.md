# Canonical Implementation Style Report

**MVM Backend Panel - Implementation Blueprint**

Generated: January 17, 2026  
Reference Module: Blog (Posts, Categories, Contributors)  
Purpose: Guide for implementing the Job Posts module consistently with existing patterns

---

## MCP access

- **Playwright MCP**: available
- **File System MCP**: available
- **File System accessible directories**:
  - `C:\Users\Mohd Faheem Ansari\MVM Files\_git\mvm-backend-clone`
  - `C:\Users\Mohd Faheem Ansari\MVM Files\_git\test-mvm-official`
- **supabase_dev MCP**: available

---

## Project architecture (admin panel)

### Next.js Router & Structure

- **Router**: Next.js 15 **App Router** (file-based routing under `src/app/`)
- **Route Groups**:
  - `(protected)` group under `/admin/(protected)/` for all authenticated admin routes
  - Login is outside protected group at `/admin/login`
- **TypeScript**: Strict mode enabled (`strict: true` in `tsconfig.json`)
- **React**: Version 19

### Folder Conventions

```
src/
├── app/                          # Next.js App Router pages
│   └── admin/
│       ├── (protected)/         # Route group - all protected admin pages
│       │   ├── layout.tsx       # Protected layout (auth + permission loading)
│       │   ├── page.tsx         # Dashboard
│       │   ├── blog/
│       │   │   ├── posts/
│       │   │   │   ├── page.tsx         # List view
│       │   │   │   ├── new/
│       │   │   │   │   └── page.tsx     # Create view
│       │   │   │   └── [id]/
│       │   │   │       ├── page.tsx     # Edit view
│       │   │   │       └── loading.tsx  # Loading state
│       │   │   ├── categories/          # Same pattern
│       │   │   └── contributors/        # Same pattern
│       │   ├── users/
│       │   ├── roles/
│       │   └── settings/
│       └── login/
│           └── page.tsx
├── actions/                      # Server Actions (one file per entity)
│   ├── blog-posts.ts
│   ├── blog-categories.ts
│   ├── blog-contributors.ts
│   ├── users.ts
│   ├── roles.ts
│   └── auth.ts
├── components/
│   ├── features/                # Feature-specific components
│   │   └── blog/
│   │       ├── PostList.tsx     # Client component for list
│   │       ├── PostForm.tsx     # Client component for create/edit
│   │       ├── CategoryList.tsx
│   │       └── ...
│   ├── layout/                  # Layout components
│   │   ├── AdminLayoutClient.tsx
│   │   ├── PageLayout.tsx       # Reusable page layout components
│   │   ├── Sidebar.tsx
│   │   └── TopBar.tsx
│   └── ui/                      # Reusable UI components
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── AdminTable/          # Table component with filters/search
│       ├── ConfirmDialog.tsx
│       └── ...
├── lib/                         # Business logic & utilities
│   ├── dal.ts                   # Data Access Layer (auth/permissions)
│   ├── supabase/
│   │   ├── server.ts           # Server-side Supabase client
│   │   ├── client.ts           # Client-side Supabase client
│   │   └── middleware.ts       # Middleware Supabase client
│   ├── blog/                   # Blog-specific business logic
│   │   ├── posts.ts
│   │   ├── categories.ts
│   │   ├── contributors.ts
│   │   └── storage.ts          # Image upload helpers
│   ├── permission-constants.ts # Permission key constants
│   ├── utils.ts                # General utilities
│   └── audit.ts                # Audit logging
├── config/
│   └── menu.ts                 # Code-defined navigation (SINGLE SOURCE OF TRUTH)
├── store/                      # Zustand state management
│   ├── index.ts
│   ├── provider.tsx
│   ├── slices/
│   │   ├── authSlice.ts
│   │   └── uiSlice.ts
│   └── types.ts
├── types/                      # TypeScript types
│   ├── blog.ts
│   ├── database.ts
│   └── index.ts
└── contexts/
    └── ToastContext.tsx
```

### Admin Shell Definition

**Location**: `src/app/admin/(protected)/layout.tsx` (Server Component)

- Calls `verifySessionWithProfile()` from DAL to ensure authentication
- Loads user permissions via `getUserPermissions()`
- Passes data to `AdminLayoutClient` (Client Component wrapper)

**Client Shell**: `src/components/layout/AdminLayoutClient.tsx`

- Wraps with `StoreProvider` (Zustand) to hydrate client state
- Wraps with `ToastProvider` for notifications
- Renders `Sidebar` + `TopBar` + `{children}`
- Responsive layout with collapsible sidebar

### Import Aliases

- `@/*` maps to `./src/*` (configured in `tsconfig.json`)
- All imports use absolute paths via `@/` prefix

### Naming Conventions

**Files & Directories**:

- **Components**: `PascalCase.tsx` (e.g., `PostList.tsx`, `Button.tsx`)
- **Non-components**: `camelCase.ts` (e.g., `utils.ts`, `dal.ts`)
- **Pages**: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx` (Next.js conventions)
- **Route folders**: lowercase with hyphens (e.g., `blog-posts`, `[id]`)

**Code**:

- Variables/functions: `camelCase`
- Components/types: `PascalCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Booleans: prefixed with `is`, `has`, `should`, `can`
- Event handlers: prefixed with `handle` or `on`

### TypeScript Strictness

From `tsconfig.json`:

```json
{
  "strict": true,
  "forceConsistentCasingInFileNames": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noFallthroughCasesInSwitch": true
}
```

From `.eslintrc.json`:

```json
{
  "@typescript-eslint/no-explicit-any": "error",
  "prefer-const": "error",
  "no-var": "error"
}
```

**No `any` allowed** - use `unknown` with proper type guards.

### Formatting & Linting

- **Prettier**: Configured with Tailwind plugin (`.prettierrc`)
- **Scripts**: `npm run format`, `npm run format:check`, `npm run lint`, `npm run type-check`
- Imports order: React → Next.js → third-party → `@/` internal → relative

---

## RBAC + authorization (current reality)

### Auth Session Management

**Session Creation & Storage**:

- **Provider**: Supabase Auth
- **Storage**: HTTP-only cookies (`sb-access-token`, `sb-refresh-token`)
- **Session lifetime**: Configurable via Supabase settings (default 1 hour access, 7 day refresh)
- **Refresh strategy**: Automatic via Supabase client

**Where Session is Read**:

1. **Middleware** (`middleware.ts`): Uses `supabase.auth.getUser()` to validate JWT on every request to `/admin/*`
2. **Server Components/Actions**: Use DAL functions (`verifySession()`, `getCurrentUser()`, `getUserProfile()`)
3. **Client Components**: Access via Zustand store (hydrated from server)

### RBAC Representation

**Database Tables** (verified via supabase_dev):

1. **`user_roles`**:
   - `id`, `name`, `description`, `is_super_admin`, `is_system`, timestamps
   - Exactly **one** role with `is_super_admin = true` (constraint enforced)
   - System roles: Super Admin, Admin, Manager

2. **`users`**:
   - Links to `auth.users` via `id` (foreign key)
   - Has `role_id` foreign key to `user_roles`
   - Profile data: `name`, `email`, `avatar_url`, `status`, timestamps

3. **`user_permissions`**:
   - `permission_key` (unique), `label`, `description`, `group`
   - 14 permissions seeded (users._, roles._, blog.\*, audit.view, settings.manage)

4. **`user_role_permissions`**:
   - Junction table: `role_id` + `permission_key`
   - Defines which permissions each role has

**How RBAC is Stored**:

- **NOT in JWT claims** - roles/permissions are fetched from DB
- User's `role_id` is in the `users` table
- Permissions are queried via join: `user_roles` → `user_role_permissions` → `user_permissions`

**Super Admin Special Handling**:

- If `user.role.is_super_admin === true`, **all permission checks return true** (bypasses `user_role_permissions`)
- Implemented in `@/lib/dal.ts`: `hasPermission()` and `getUserPermissions()`

### Enforcement Layers

#### 1. Route Protection (Middleware)

**File**: `middleware.ts`

```typescript
// Validates JWT with supabase.auth.getUser()
// Redirects unauthenticated users to / with message
// Runs on ALL /admin/* routes (except /auth/forgot-password)
```

**Evidence**:

- Calls `createClient(request)` from `@/lib/supabase/middleware`
- Uses `await supabase.auth.getUser()` (NOT `getSession()`) for security
- Redirects to `/?message=...&redirect=...`

#### 2. Server-Side Authorization (DAL + Server Actions)

**File**: `src/lib/dal.ts`

**Key Functions**:

- `verifySession()`: Validates JWT, redirects if invalid
- `getUserProfile()`: Fetches user + role info
- `getUserPermissions()`: Returns permission keys for user (or all if Super Admin)
- `hasPermission(key: string)`: Checks if user has specific permission
- `requirePermission(permissions: string | string[], requireAll?: boolean)`: Throws error if unauthorized

**Usage Pattern** (from `src/actions/blog-posts.ts`):

```typescript
export async function getPostsAction(...) {
  try {
    await verifySession()                        // 1. Validate auth
    await requirePermission(Permissions.BLOG_VIEW)  // 2. Check permission
    const supabase = await createClient()
    // ... fetch data with RLS in effect
  } catch (error) {
    return { success: false, error: '...' }
  }
}
```

**All Server Actions follow this pattern**:

1. Call `verifySession()` or `verifySessionWithProfile()`
2. Call `requirePermission(...)` with permission constant
3. Perform DB operation (RLS provides additional layer)
4. Log to audit trail if mutating data
5. Revalidate paths with `revalidatePath()`

#### 3. UI Gating (Client Components)

**File**: Client components use Zustand store

**Pattern** (from `src/components/features/blog/PostList.tsx`):

```tsx
'use client'
import { useAuth } from '@/store/provider'

export function PostList({ posts }) {
  const { hasPermission } = useAuth()

  return (
    <div>
      {hasPermission('blog.edit') && <Button onClick={handleEdit}>Edit</Button>}
      {hasPermission('blog.delete') && <Button onClick={handleDelete}>Delete</Button>}
    </div>
  )
}
```

**How Client Gets Permissions**:

1. Server layout (`layout.tsx`) calls `getUserPermissions()`
2. Passes to `AdminLayoutClient` as prop
3. `StoreProvider` hydrates Zustand with `initialState.permissions`
4. Client components use `useAuth()` hook to access `hasPermission(key)`

#### 4. Data-Level Protection (RLS Policies)

**Verified via supabase_dev** - All tables have RLS enabled.

**Blog Tables RLS** (from `pg_policies` query):

```sql
-- blog_posts (5 policies)
Allow authenticated users to read all posts (SELECT)
Allow authenticated users to insert posts (INSERT)
Allow authenticated users to update posts (UPDATE)
Allow authenticated users to delete posts (DELETE)
Allow service role full access to posts (ALL)

-- blog_categories (5 policies)
Allow authenticated users to read categories (SELECT)
Allow authenticated users to insert categories (INSERT)
Allow authenticated users to update categories (UPDATE)
Allow authenticated users to delete categories (DELETE)
Allow service role full access to categories (ALL)

-- blog_contributors (5 policies)
[Same pattern as categories]
```

**Important**: RLS policies allow **authenticated** users to read/write, but **application-level permission checks** in Server Actions provide granular control. This is a defense-in-depth approach.

**Users & Roles Tables**:

- `users`: Authenticated users can SELECT; only service role can INSERT/DELETE; users can UPDATE own profile
- `user_roles`: Authenticated can SELECT; service role can do all
- `user_permissions`: Authenticated can SELECT; service role can do all
- `user_role_permissions`: Authenticated can SELECT; service role can do all

### Evidence Walkthroughs

#### Flow 1: View Blog Posts List

1. **User visits** `/admin/blog/posts`
2. **Middleware** (`middleware.ts`):
   - Calls `supabase.auth.getUser()` to validate JWT
   - If invalid → redirect to `/`
   - If valid → allow request to proceed
3. **Protected Layout** (`app/admin/(protected)/layout.tsx`):
   - Server Component calls `verifySessionWithProfile()` from DAL
   - Calls `getUserPermissions()` (returns array like `['blog.view', 'blog.edit', ...]`)
   - Passes to `AdminLayoutClient` → hydrates Zustand store
4. **Page** (`app/admin/(protected)/blog/posts/page.tsx`):
   - Server Component calls `getPostsAction({ page, search, ... })`
5. **Server Action** (`actions/blog-posts.ts`):
   - `await verifySession()` - validates JWT again
   - `await requirePermission(Permissions.BLOG_VIEW)` - throws if user lacks permission
   - `const supabase = await createClient()` - gets server Supabase client (anon key)
   - `supabase.from('blog_posts').select('*')` - RLS allows authenticated SELECT
   - Returns `{ success: true, data: { posts, total, pages } }`
6. **Page renders** `<PostList>` with data
7. **Client Component** (`PostList.tsx`):
   - Uses `useAuth()` to get `hasPermission` function
   - Conditionally renders Edit/Delete buttons based on `hasPermission('blog.edit')`, etc.

**Network/DB calls**:

- Middleware: 1 auth call to Supabase Auth
- Layout: 1 profile query + 1 permissions query (cached via React `cache()`)
- Action: 1 auth validation + 1 SELECT query to `blog_posts`

#### Flow 2: Edit Blog Post → Save

1. **User clicks Edit** on a post
2. **Navigation**: Client-side to `/admin/blog/posts/[id]`
3. **Page** (`app/admin/(protected)/blog/posts/[id]/page.tsx`):
   - Calls `getPostByIdAction(id)` and `getAllCategoriesForSelectAction()`
   - Both actions verify session + permission (`BLOG_VIEW`)
4. **Page renders** `<PostForm isEditing post={post} />`
5. **User edits** title, content, etc., **clicks Save**
6. **Client Component** (`PostForm.tsx`):
   - `'use client'` component with form state
   - Calls `updatePostAction(postId, formData)` (imported Server Action)
7. **Server Action** (`updatePostAction` in `actions/blog-posts.ts`):
   - `await verifySession()` - validates user
   - `await requirePermission(Permissions.BLOG_EDIT)` - checks permission
   - Fetches existing post to compare changes
   - Generates new slug if title changed (calls `generateSlugFromTitle()`)
   - Updates `blog_posts` table via Supabase (RLS allows authenticated UPDATE)
   - Creates audit log via `createAuditLog()` (uses service role client)
   - Calls `revalidatePath('/admin/blog/posts')` to refresh cache
   - Returns `{ success: true, message: 'Post updated successfully' }`
8. **Client Component** receives response, shows toast, refreshes via `router.refresh()`

**Authorization checks**:

- Middleware (route-level)
- `getPostByIdAction` (read permission)
- `updatePostAction` (edit permission + validation)
- RLS (DB-level for authenticated users)

#### Flow 3: Publish Blog Post

1. **User clicks Publish** button
2. **Client Component** (`PostList.tsx`):
   - Renders Publish button only if `hasPermission('blog.publish')`
   - Calls `publishPostAction(postId)` (Server Action)
3. **Server Action** (`publishPostAction`):
   - `await verifySession()`
   - `await requirePermission(Permissions.BLOG_PUBLISH)`
   - Validates post can be published via `canPublishPost(post)` (checks required fields)
   - If invalid → returns `{ success: false, error: 'Missing required fields' }`
   - Updates `status = 'published'`, sets `published_date` and `published_by`
   - Creates audit log
   - Returns success
4. **Client refreshes** list

**Key insight**: Different permission for publishing vs editing (`blog.publish` vs `blog.edit`).

---

## Blog module blueprint (the canonical CRUD pattern)

The Blog module consists of **three sub-modules**: Posts, Categories, Contributors. All follow the same pattern.

### Routes/Screens

For each entity (Posts, Categories, Contributors):

1. **List View**: `/admin/blog/{entity}/page.tsx`
   - Server Component
   - Calls `get{Entity}Action()` with pagination/filters
   - Renders `{Entity}List` client component

2. **Create View**: `/admin/blog/{entity}/new/page.tsx`
   - Server Component
   - Loads dependencies (e.g., categories for post form)
   - Renders `{Entity}Form` without initial data

3. **Edit View**: `/admin/blog/{entity}/[id]/page.tsx`
   - Server Component
   - Calls `get{Entity}ByIdAction(id)` to fetch data
   - Renders `{Entity}Form` with `isEditing` prop
   - Includes `loading.tsx` for Suspense

**No detail/preview screen** in admin - edit serves as detail view.

### Form Patterns

**Library**: No external form library (React Hook Form, Formik, etc.). Uses **React state + Server Actions**.

**Validation**:

- **Client-side**: Basic HTML5 validation (`required`, `minLength`, etc.) + custom JS validation
- **Server-side**: Validation in Server Actions (required fields, business rules)
- **No Zod** or other schema validation library detected in dependencies

**Example**: `PostForm.tsx` (heavily truncated for clarity)

```tsx
'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createPostAction, updatePostAction } from '@/actions/blog-posts'

export function PostForm({ post, categories, contributors, isEditing }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState({
    title: post?.title || '',
    description: post?.description || '',
    category_id: post?.category_id || null,
    status: post?.status || 'draft',
    // ... all fields
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Client-side validation
    const newErrors: Record<string, string> = {}
    if (!formData.title.trim()) newErrors.title = 'Title required'
    // ... more validation

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    startTransition(async () => {
      const result = isEditing
        ? await updatePostAction(post.id, formData)
        : await createPostAction(formData)

      if (result.success) {
        showToast('success', result.message)
        router.push('/admin/blog/posts')
        router.refresh()
      } else {
        showToast('error', result.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <Input
        label="Title"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        error={errors.title}
        required
      />
      {/* ... more fields */}
      <Button type="submit" isLoading={isPending}>
        {isEditing ? 'Update' : 'Create'}
      </Button>
    </form>
  )
}
```

**Key conventions**:

- Form state in `useState`
- Server action calls wrapped in `startTransition`
- Loading state via `isPending` from `useTransition`
- Errors displayed inline per field
- Success → navigate + refresh
- All forms are controlled components

**Field Components**:

- Reusable `Input`, `Select`, `Textarea` from `@/components/ui/`
- TipTap editor for rich text (blog post content)
- Image upload handled separately via Server Action + `<input type="file">`

### Data Layer Patterns

**Read Operations**:

File: `src/actions/blog-posts.ts`

```typescript
export async function getPostsAction(params: GetPostsParams) {
  try {
    await verifySession()
    await requirePermission(Permissions.BLOG_VIEW)

    const supabase = await createClient() // Server-side client
    const page = params.page || 1
    const limit = params.limit || 10
    const offset = (page - 1) * limit

    let query = supabase
      .from('blog_posts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply filters
    if (params.search) {
      query = query.or(`title.ilike.%${params.search}%,description.ilike.%${params.search}%`)
    }
    if (params.status) query = query.eq('status', params.status)

    const { data, error, count } = await query.range(offset, offset + limit - 1)

    if (error) return { success: false, error: 'Failed to fetch posts' }

    return {
      success: true,
      data: {
        posts: data || [],
        total: count || 0,
        page,
        pages: Math.ceil((count || 0) / limit),
      },
    }
  } catch (error) {
    return { success: false, error: 'Unexpected error' }
  }
}
```

**Pattern**:

1. Validate auth + permission
2. Get server Supabase client (anon key - RLS applies)
3. Build query with filters/pagination
4. Execute query
5. Return standardized `ActionResponse<T>` type

**Write Operations**:

```typescript
export async function createPostAction(formData: BlogPostFormData) {
  try {
    const user = await verifySession()
    await requirePermission(Permissions.BLOG_EDIT)

    const supabase = await createClient()

    // Business logic
    const slug = await generateSlugFromTitle(formData.title)
    const reading_time = calculateReadingTime(formData.content)

    // Insert
    const { data: post, error } = await supabase
      .from('blog_posts')
      .insert({
        ...formData,
        slug,
        reading_time,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single()

    if (error) return { success: false, error: 'Failed to create post' }

    // Audit log
    await createAuditLog({
      actorId: user.id,
      actionType: AUDIT_ACTION_TYPES.BLOG_POST_CREATED,
      targetType: 'blog_post',
      targetId: post.id,
      metadata: { post_title: post.title },
    })

    // Revalidate
    revalidatePath('/admin/blog/posts')

    return { success: true, data: post, message: 'Post created' }
  } catch (error) {
    return { success: false, error: 'Unexpected error' }
  }
}
```

**Pattern**:

1. Auth + permission check
2. Business logic (slug generation, reading time calc, etc.)
3. Insert/update with `created_by`/`updated_by` tracking
4. Audit logging (uses service role client internally)
5. Path revalidation for Next.js cache
6. Return success/error

**No Route Handlers or API Routes** - all data operations via Server Actions.

### Pagination/Filtering/Search

**Implementation**: `AdminTable` component handles all UI

**URL-based state**:

- `?page=1`
- `?search=keyword`
- `?status=published`
- `?category=uuid`

**Pattern** (from `PostList.tsx`):

```tsx
<AdminTable
  data={posts}
  columns={columns}
  searchable
  searchPlaceholder="Search posts..."
  filters={[
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'published', label: 'Published' },
      ],
    },
    // ... more filters
  ]}
  pagination={{ page, pageSize: 10, total, totalPages }}
/>
```

`AdminTable` manages:

- Search input with debounced URL updates
- Filter dropdowns/selects
- Pagination controls
- URL state via `useRouter` + `useSearchParams`

### Content Handling

**Rich Text Editor**: TipTap (used in `PostForm.tsx`)

```tsx
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
// ... extensions

const editor = useEditor({
  extensions: [StarterKit, Image, Link, Table, CodeBlock, ...],
  content: formData.content,
  onUpdate: ({ editor }) => {
    setFormData({ ...formData, content: editor.getHTML() })
  },
})

return <EditorContent editor={editor} />
```

**Image Uploads**:

File: `src/lib/blog/storage.ts`

```typescript
export async function uploadBlogCover(file: File, postId: string) {
  // Validate file type/size
  // Delete old images for this post
  // Upload to Supabase Storage bucket 'blog-cover-images'
  // Return public URL
}
```

**Process**:

1. User selects file in form
2. Form calls `uploadPostCoverAction(postId, formData)` Server Action
3. Server Action validates, uploads via `uploadBlogCover()`, updates DB
4. Returns URL to client
5. Client updates form state with new URL

**Bucket**: `blog-cover-images` (for covers), `blog-contributor-avatars` (for avatars)

**Slug Generation**:

```typescript
export async function generateSlugFromTitle(title: string, excludeId?: string) {
  const baseSlug = slugify(title) // lowercase, hyphens, etc.
  // Check DB for uniqueness
  // If exists, append -1, -2, etc.
  return uniqueSlug
}
```

**SEO Fields**:

- `seo_meta_title` (max 60 chars)
- `seo_meta_description` (max 160 chars)
- `seo_keywords`
- `seo_additional_schemas` (JSON array for Schema.org markup)

Validation via `validateSEOFieldLengths()` helper.

**Status Workflow**:

- `draft` → can edit freely
- `draft` → `publish` requires all fields (title, description, content, cover, category, contributor)
- `published` → cannot delete (must unpublish first)
- `published` → `unpublished` → `published` (republish)

### Key Files/Paths (Blog Module)

**Routes**:

- `src/app/admin/(protected)/blog/posts/page.tsx` - Posts list
- `src/app/admin/(protected)/blog/posts/new/page.tsx` - Create post
- `src/app/admin/(protected)/blog/posts/[id]/page.tsx` - Edit post
- `src/app/admin/(protected)/blog/categories/page.tsx` - Categories list
- `src/app/admin/(protected)/blog/categories/new/page.tsx` - Create category
- `src/app/admin/(protected)/blog/categories/[id]/page.tsx` - Edit category
- `src/app/admin/(protected)/blog/contributors/page.tsx` - Contributors list
- `src/app/admin/(protected)/blog/contributors/new/page.tsx` - Create contributor
- `src/app/admin/(protected)/blog/contributors/[id]/page.tsx` - Edit contributor

**Server Actions**:

- `src/actions/blog-posts.ts` - All post CRUD + publish/unpublish/upload
- `src/actions/blog-categories.ts` - Category CRUD + validation
- `src/actions/blog-contributors.ts` - Contributor CRUD + avatar upload

**Components**:

- `src/components/features/blog/PostList.tsx` - Posts table with actions
- `src/components/features/blog/PostForm.tsx` - Create/edit form with TipTap editor
- `src/components/features/blog/CategoryList.tsx` - Categories table
- `src/components/features/blog/CategoryForm.tsx` - Category form
- `src/components/features/blog/ContributorList.tsx` - Contributors table
- `src/components/features/blog/ContributorForm.tsx` - Contributor form
- `src/components/features/blog/StatusBadge.tsx` - Status badge component
- `src/components/features/blog/BlogUrlDisplay.tsx` - Preview URL display

**Business Logic**:

- `src/lib/blog/posts.ts` - Post helpers (slug, reading time, validation)
- `src/lib/blog/categories.ts` - Category helpers
- `src/lib/blog/contributors.ts` - Contributor helpers
- `src/lib/blog/storage.ts` - Image upload/delete helpers

**Types**:

- `src/types/blog.ts` - All blog-related types

---

## Supabase integration patterns (admin-side)

### Client Initialization

**Three Clients**:

1. **Server Client** (`src/lib/supabase/server.ts`):

   ```typescript
   import { createServerClient } from '@supabase/ssr'

   export async function createClient() {
     const cookieStore = await cookies()
     return createServerClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, {
       cookies: { getAll, setAll },
     })
   }
   ```

   - Used in Server Components, Server Actions, Route Handlers
   - Uses anon key (RLS enforced)
   - Reads cookies for auth

2. **Admin Client** (`src/lib/supabase/server.ts`):

   ```typescript
   export async function createAdminClient() {
     return createServiceRoleClient(
       NEXT_PUBLIC_SUPABASE_URL,
       SUPABASE_SERVICE_ROLE_KEY, // ⚠️ Bypasses RLS
       { auth: { persistSession: false } }
     )
   }
   ```

   - Used for admin operations: user invitations, audit logs
   - **Never exposed to client**
   - Singleton pattern (created once, reused)

3. **Browser Client** (`src/lib/supabase/client.ts`):

   ```typescript
   import { createBrowserClient } from '@supabase/ssr'

   export function createClient() {
     return createBrowserClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
   }
   ```

   - Used in Client Components (rare, mostly for real-time features)
   - **NOT used for mutations** - all mutations via Server Actions

### RPCs / Edge Functions

**No RPC functions used** in admin panel (all queries are direct Supabase queries).

**Edge Functions** (in `supabase/functions/`):

- `blog-get-post` - Public API for fetching single post
- `blog-list-posts` - Public API for listing posts
- `send-contact-email` - Public contact form
- `send-dynamic-email` - Email sending utility
- Others for public-facing features

**Admin does NOT call Edge Functions** - uses direct Supabase queries via Server Actions.

### RLS Policies (Admin Perspective)

**Philosophy**: RLS provides **defense-in-depth**, not primary authorization.

**Blog Tables**:

- All have RLS enabled
- Policies allow `authenticated` role to read/write
- Application-level permission checks in Server Actions provide granular control
- Service role bypasses RLS (used for audit logs, invitations)

**Example** (from supabase_dev output):

```sql
-- blog_posts table
"Allow authenticated users to read all posts" (SELECT) - qual: true
"Allow authenticated users to insert posts" (INSERT) - with_check: true
"Allow authenticated users to update posts" (UPDATE) - qual: true, with_check: true
"Allow authenticated users to delete posts" (DELETE) - qual: true
"Allow service role full access to posts" (ALL) - qual: true, with_check: true
```

**Key Insight**: RLS is **permissive** (allows all authenticated users). Fine-grained control happens in Server Actions via `requirePermission()`.

**User Management Tables**:

- `users`: Can SELECT, UPDATE own profile; service role can INSERT/DELETE
- `user_roles`, `user_permissions`, `user_role_permissions`: Can SELECT; service role can mutate
- `user_audit_logs`: Can SELECT; service role can INSERT

### Storage Buckets

**Buckets Used**:

1. `blog-cover-images` - Blog post cover images
2. `blog-contributor-avatars` - Contributor profile avatars
3. (Inference) Likely `user-avatars` for admin user avatars

**Upload Pattern**:

```typescript
// In Server Action
const supabase = await createClient()

// Upload
const { error } = await supabase.storage
  .from('blog-cover-images')
  .upload(`covers/${postId}/${timestamp}.jpg`, file, { upsert: true })

// Get public URL
const { data } = supabase.storage
  .from('blog-cover-images')
  .getPublicUrl(`covers/${postId}/${timestamp}.jpg`)

return data.publicUrl
```

**Cleanup**: Before uploading, delete old files for same entity (prevents orphaned files).

**Configured in** `next.config.js`:

```javascript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: '**.supabase.co',
      pathname: '/storage/v1/object/public/**',
    },
  ],
}
```

---

## Coding style guide (derived from code)

### Adding New Modules

**Steps** (based on Blog module):

1. **Update Menu Config** (`src/config/menu.ts`):

   ```typescript
   {
     id: 'job-posts',
     label: 'Job Posts',
     path: '/admin/job-posts',
     icon: 'Briefcase',
     permissionKey: Permissions.JOB_POSTS_VIEW,
     relatedPermissions: [
       { key: 'job-posts.view', label: 'View Job Posts', group: 'Job Posts', ... },
       // ... more permissions
     ],
   }
   ```

2. **Add Permission Constants** (`src/lib/permission-constants.ts`):

   ```typescript
   export const Permissions = {
     // ... existing
     JOB_POSTS_VIEW: 'job-posts.view',
     JOB_POSTS_EDIT: 'job-posts.edit',
     JOB_POSTS_DELETE: 'job-posts.delete',
     JOB_POSTS_PUBLISH: 'job-posts.publish',
   }
   ```

3. **Create Routes**:
   - `src/app/admin/(protected)/job-posts/page.tsx` (list)
   - `src/app/admin/(protected)/job-posts/new/page.tsx` (create)
   - `src/app/admin/(protected)/job-posts/[id]/page.tsx` (edit)
   - `src/app/admin/(protected)/job-posts/[id]/loading.tsx` (loading state)

4. **Create Server Actions** (`src/actions/job-posts.ts`):
   - `getJobPostsAction()`
   - `getJobPostByIdAction()`
   - `createJobPostAction()`
   - `updateJobPostAction()`
   - `deleteJobPostAction()`
   - `publishJobPostAction()` (if needed)

5. **Create Components** (`src/components/features/job-posts/`):
   - `JobPostList.tsx`
   - `JobPostForm.tsx`
   - Any other supporting components

6. **Create Types** (`src/types/job-posts.ts`):
   - `JobPost`, `JobPostFormData`, etc.

7. **Create Business Logic** (`src/lib/job-posts/`):
   - Helpers for validation, slug generation, etc.

8. **Database Migration** (via Supabase CLI):
   - Create table, RLS policies, indexes

### Component Conventions

**Props Typing**:

```typescript
interface PostFormProps {
  post?: BlogPost // Optional for create mode
  categories: CategoryOption[]
  contributors: ContributorOption[]
  isEditing?: boolean
}

export function PostForm({ post, categories, contributors, isEditing = false }: PostFormProps) {
  // ...
}
```

**File Structure**:

```typescript
// 1. Imports (React, Next, third-party, internal, relative)
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

// 2. Types/Interfaces
interface Props { ... }

// 3. Component
export function Component({ ... }: Props) {
  // 3a. Hooks
  const router = useRouter()
  const [state, setState] = useState()

  // 3b. Handlers
  const handleClick = () => { ... }

  // 3c. Effects
  useEffect(() => { ... }, [])

  // 3d. Render
  return <div>...</div>
}
```

**Composition**: Prefer small, focused components over large monoliths.

### Data Fetching Conventions

**Server Components** (preferred for data fetching):

```typescript
export default async function PostsPage({ searchParams }: PostsPageProps) {
  const params = await searchParams  // Next.js 15 requires await
  const page = Number(params.page) || 1

  const result = await getPostsAction({ page, limit: 10 })

  if (!result.success) {
    return <ErrorMessage message={result.error} />
  }

  return <PostList posts={result.data.posts} />
}
```

**Loading States**:

- Use `loading.tsx` for page-level Suspense
- Use `isLoading` state + `LoadingOverlay` for actions in Client Components

**Error Handling**:

- Use `error.tsx` for page-level error boundaries (Client Component)
- Display inline errors in forms via error state

### State Management Conventions

**When to Use Zustand**:

- Global app state (user, permissions, theme, sidebar state)
- Shared UI state across components

**When to Use Local State**:

- Form input values
- Component-specific UI state (modals open/closed, dropdowns)
- Transient data that doesn't need to persist

**Pattern**:

```typescript
// Client Component
'use client'
import { useAuth, useSidebar } from '@/store/provider'

export function Component() {
  const { user, hasPermission } = useAuth()
  const { collapsed, toggle } = useSidebar()
  const [localState, setLocalState] = useState('')

  // Use global state for auth/permissions/UI
  // Use local state for form inputs
}
```

### UI Conventions

**Tables**:

- Use `AdminTable` component (handles search, filters, pagination)
- Define columns as array of `Column<T>` objects
- Extract key via `keyExtractor` prop
- Provide pagination config if paginated

**Forms**:

- Use `PageContainer` + `PageHeader` + `FormContainer` layout
- Individual field components: `Input`, `Select`, `Textarea`
- Validation: client-side + server-side
- Submit via Server Action wrapped in `startTransition`
- Show loading state with `isPending`

**Dialogs/Modals**:

- Use `ConfirmDialog` for destructive actions
- State: `const [dialogOpen, setDialogOpen] = useState(false)`

**Toasts**:

- Use `useToast()` from `ToastContext`
- `success(message)`, `error(message)`, `info(message)`

**Buttons**:

- Use `Button` component with variants: `primary`, `secondary`, `outline`, `ghost`, `danger`
- Sizes: `sm`, `md`, `lg`
- Loading: `<Button isLoading={isPending}>Submit</Button>`

**Styling**:

- Tailwind utility classes (no CSS modules unless complex)
- Use `cn()` utility to merge classes
- Brand colors: `mvm-blue` (#025fc7), `mvm-yellow` (#ba9309)
- Gradient: `bg-gradient-mvm` (blue to yellow)

### Error Handling + Logging Conventions

**Server Actions**:

```typescript
try {
  await verifySession()
  await requirePermission(...)
  // ... logic
  return { success: true, data, message }
} catch (error) {
  console.error('Error in action:', error)  // Server-side log
  return { success: false, error: 'User-friendly message' }
}
```

**Never expose internal errors to client** - return generic messages.

**Audit Logging**:

```typescript
await createAuditLog({
  actorId: user.id,
  actionType: AUDIT_ACTION_TYPES.BLOG_POST_CREATED,
  targetType: 'blog_post',
  targetId: post.id,
  metadata: { post_title: post.title, status: post.status },
})
```

**Log for**:

- Create/update/delete operations
- Status changes (publish/unpublish)
- Role/permission changes
- User invitations

**Do NOT log**:

- Read operations (too noisy)
- Password resets (sensitive)

---

## "Job Posts module" requirements checklist (do NOT implement)

### Screens to Build

Based on Blog's structure, create:

1. **List View** (`/admin/job-posts/page.tsx`):
   - Table with columns: Job Title, Location, Employment Type, Status, Posted Date, Actions
   - Search by title/description
   - Filters: status, employment type, location
   - Pagination (10 per page)
   - Create button (permission-gated)

2. **Create View** (`/admin/job-posts/new/page.tsx`):
   - Form with all job fields
   - Save as draft or publish
   - Upload featured image (optional)

3. **Edit View** (`/admin/job-posts/[id]/page.tsx`):
   - Same form as create, pre-filled
   - Show preview URL (if published)
   - Publish/Unpublish actions
   - Delete (if not published)

4. **Loading State** (`/admin/job-posts/[id]/loading.tsx`):
   - Skeleton loader

### Job Post Entity (Proposed Fields)

**Note**: Marked as "proposal" since not directly evidenced from Blog.

**Required Fields**:

- `id` (UUID, PK)
- `title` (text) - Job title
- `slug` (text, unique) - URL-friendly identifier
- `description` (text) - Short summary
- `content` (text) - Full job description (TipTap JSON or HTML)
- `location` (text) - e.g., "Remote", "New York, NY", "Hybrid - San Francisco"
- `employment_type` (enum) - "full-time", "part-time", "contract", "internship"
- `status` (enum) - "draft", "published", "closed"

**Optional Fields**:

- `featured_image_url` (text) - Cover image
- `salary_min` (integer) - Minimum salary
- `salary_max` (integer) - Maximum salary
- `salary_currency` (text) - "USD", "EUR", etc.
- `application_url` (text) - External application link
- `application_email` (text) - Email for applications
- `published_date` (timestamp)
- `closing_date` (timestamp) - Application deadline
- `experience_level` (text) - "Entry", "Mid", "Senior"
- `department` (text or FK to departments table) - e.g., "Engineering", "Marketing"

**Audit Fields** (like Blog):

- `created_at`, `updated_at`, `created_by`, `updated_by`, `published_by`

**SEO Fields** (like Blog):

- `seo_meta_title`, `seo_meta_description`, `seo_keywords`

### Codebase Location

**Routes**:

- `src/app/admin/(protected)/job-posts/page.tsx`
- `src/app/admin/(protected)/job-posts/new/page.tsx`
- `src/app/admin/(protected)/job-posts/[id]/page.tsx`
- `src/app/admin/(protected)/job-posts/[id]/loading.tsx`

**Server Actions**:

- `src/actions/job-posts.ts`

**Components**:

- `src/components/features/job-posts/JobPostList.tsx`
- `src/components/features/job-posts/JobPostForm.tsx`
- `src/components/features/job-posts/StatusBadge.tsx` (or reuse from blog)

**Business Logic**:

- `src/lib/job-posts/posts.ts` - Helpers (slug, validation, etc.)
- `src/lib/job-posts/storage.ts` - Image uploads (if needed)

**Types**:

- `src/types/job-posts.ts`

**Menu**:

- Add to `src/config/menu.ts` under new top-level item or under existing section

**Permissions**:

- Add to `src/lib/permission-constants.ts`

### Supabase Pieces Needed

**Table**:

```sql
CREATE TABLE job_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  content TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL,
  employment_type job_employment_type NOT NULL,  -- Custom enum
  status job_post_status NOT NULL DEFAULT 'draft',  -- Custom enum
  featured_image_url TEXT,
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency TEXT,
  application_url TEXT,
  application_email TEXT,
  published_date TIMESTAMPTZ,
  closing_date TIMESTAMPTZ,
  experience_level TEXT,
  department TEXT,
  seo_meta_title TEXT DEFAULT '',
  seo_meta_description TEXT DEFAULT '',
  seo_keywords TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  published_by UUID REFERENCES users(id)
);
```

**Enums**:

```sql
CREATE TYPE job_employment_type AS ENUM ('full-time', 'part-time', 'contract', 'internship');
CREATE TYPE job_post_status AS ENUM ('draft', 'published', 'closed');
```

**Indexes**:

```sql
CREATE INDEX idx_job_posts_slug ON job_posts(slug);
CREATE INDEX idx_job_posts_status ON job_posts(status);
CREATE INDEX idx_job_posts_published_date ON job_posts(published_date);
```

**RLS Policies** (match Blog pattern):

```sql
ALTER TABLE job_posts ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read/write (app-level perms provide granular control)
CREATE POLICY "Allow authenticated users to read all job posts"
  ON job_posts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert job posts"
  ON job_posts FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update job posts"
  ON job_posts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete job posts"
  ON job_posts FOR DELETE TO authenticated USING (true);

-- Service role bypass
CREATE POLICY "Allow service role full access to job posts"
  ON job_posts FOR ALL TO service_role USING (true) WITH CHECK (true);
```

**Triggers** (auto-update timestamps):

```sql
CREATE TRIGGER update_job_posts_updated_at
  BEFORE UPDATE ON job_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Storage Bucket** (if using featured images):

```sql
-- Via Supabase dashboard or CLI
-- Create bucket: job-post-images
-- Set to public
-- RLS policies for authenticated upload/delete
```

**Permissions Sync**:

- Add permissions to `user_permissions` table via migration or sync script
- Permission keys: `job-posts.view`, `job-posts.edit`, `job-posts.delete`, `job-posts.publish`

### Implementation Checklist

#### Step 1: Database Setup

- [ ] Create migration file in `supabase/migrations/`
- [ ] Define `job_employment_type` enum
- [ ] Define `job_post_status` enum
- [ ] Create `job_posts` table with all fields
- [ ] Add indexes for slug, status, published_date
- [ ] Enable RLS on `job_posts`
- [ ] Create RLS policies (5 policies: SELECT, INSERT, UPDATE, DELETE, service_role ALL)
- [ ] Create trigger for `updated_at`
- [ ] Seed permissions into `user_permissions` table
- [ ] (Optional) Create `job-post-images` storage bucket

#### Step 2: Type Definitions

- [ ] Create `src/types/job-posts.ts`
- [ ] Define `JobPost`, `JobPostFormData`, `JobPostStatus`, `EmploymentType` types
- [ ] Define validation result types
- [ ] Export from `src/types/index.ts`

#### Step 3: Permission Constants

- [ ] Add to `src/lib/permission-constants.ts`:
  - `JOB_POSTS_VIEW: 'job-posts.view'`
  - `JOB_POSTS_EDIT: 'job-posts.edit'`
  - `JOB_POSTS_DELETE: 'job-posts.delete'`
  - `JOB_POSTS_PUBLISH: 'job-posts.publish'`
- [ ] Add to `PermissionGroups.JOB_POSTS` array

#### Step 4: Menu Configuration

- [ ] Add to `src/config/menu.ts`:
  ```typescript
  {
    id: 'job-posts',
    label: 'Job Posts',
    path: '/admin/job-posts',
    icon: 'Briefcase',
    permissionKey: Permissions.JOB_POSTS_VIEW,
    relatedPermissions: [ /* ... */ ],
  }
  ```

#### Step 5: Business Logic

- [ ] Create `src/lib/job-posts/posts.ts`
- [ ] Implement `generateSlugFromTitle(title, excludeId?)`
- [ ] Implement `canPublishJobPost(post)` - validate required fields
- [ ] Implement `canDeleteJobPost(post)` - prevent deletion of published posts
- [ ] (Optional) Create `src/lib/job-posts/storage.ts` for image uploads

#### Step 6: Server Actions

- [ ] Create `src/actions/job-posts.ts`
- [ ] Implement `getJobPostsAction(params)` - list with pagination/filters
- [ ] Implement `getJobPostByIdAction(id)` - single post
- [ ] Implement `createJobPostAction(formData)` - with audit log
- [ ] Implement `updateJobPostAction(id, formData)` - with audit log
- [ ] Implement `deleteJobPostAction(id)` - with validation + audit log
- [ ] Implement `publishJobPostAction(id)` - with validation + audit log
- [ ] Implement `unpublishJobPostAction(id)` - with audit log
- [ ] (Optional) Implement `uploadJobPostImageAction(id, formData)`

#### Step 7: Components

- [ ] Create `src/components/features/job-posts/JobPostList.tsx` (Client Component)
  - Use `AdminTable` with search, filters (status, employment type), pagination
  - Actions: Edit, Publish/Unpublish, Delete (permission-gated)
  - Handle loading/error states
- [ ] Create `src/components/features/job-posts/JobPostForm.tsx` (Client Component)
  - Form fields: title, description, location, employment type, salary, etc.
  - TipTap editor for content
  - Image upload for featured image
  - Save as draft or publish
  - Client + server validation
- [ ] (Optional) Create `src/components/features/job-posts/StatusBadge.tsx`
  - Display status with color coding (draft: gray, published: green, closed: red)

#### Step 8: Routes

- [ ] Create `src/app/admin/(protected)/job-posts/page.tsx` (Server Component)
  - Fetch job posts via `getJobPostsAction()`
  - Render `JobPostList`
  - Handle errors with `ErrorMessage`
- [ ] Create `src/app/admin/(protected)/job-posts/new/page.tsx` (Server Component)
  - Render `JobPostForm` without initial data
- [ ] Create `src/app/admin/(protected)/job-posts/[id]/page.tsx` (Server Component)
  - Fetch post via `getJobPostByIdAction()`
  - Render `JobPostForm` with `isEditing` prop
  - Handle 404 with `notFound()`
- [ ] Create `src/app/admin/(protected)/job-posts/[id]/loading.tsx`
  - Skeleton loader (use `LoadingState` component)

#### Step 9: Audit Actions

- [ ] Add to `src/lib/audit.ts`:
  - `JOB_POST_CREATED`
  - `JOB_POST_UPDATED`
  - `JOB_POST_DELETED`
  - `JOB_POST_PUBLISHED`
  - `JOB_POST_UNPUBLISHED`
  - `JOB_POST_CLOSED`

#### Step 10: Testing & Verification

- [ ] Run migration: `npx supabase migration up`
- [ ] Verify table created in Supabase dashboard
- [ ] Verify RLS enabled and policies active
- [ ] Test navigation to `/admin/job-posts` (should redirect if no permission)
- [ ] Assign `job-posts.view` permission to a test role
- [ ] Verify list view loads
- [ ] Test create flow: draft save, validation errors, publish
- [ ] Test edit flow: update fields, slug regeneration
- [ ] Test delete: validation (can't delete published), success
- [ ] Test publish/unpublish flow
- [ ] Verify audit logs created
- [ ] Check responsive design on mobile
- [ ] Test search and filters

---

## Summary

This report documents the **canonical implementation style** of the MVM Backend Panel based on the existing **Blog module**. Key takeaways:

1. **Architecture**: Next.js 15 App Router with strict TypeScript, server-first data fetching, and modular organization
2. **RBAC**: Multi-layered (middleware → DAL → Server Actions → RLS), with Super Admin bypass and code-defined permissions
3. **Blog Pattern**: List/Create/Edit screens → Server Actions → Supabase queries → Client Components with permission gating
4. **Data Flow**: Server Components fetch → Server Actions mutate → AdminTable displays → Forms submit via Server Actions
5. **Code Style**: Functional, type-safe, with clear separation between server (auth/data) and client (UI/interactions)

Use this report as the **blueprint** for implementing the Job Posts module (or any future module) with full consistency to existing patterns.

---

**End of Report**
