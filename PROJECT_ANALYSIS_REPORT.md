# PROJECT ANALYSIS REPORT

**Generated**: January 19, 2026  
**Workspace**: C:\Users\Mohd Faheem Ansari\MVM Files_git  
**Analysis Method**: FileSystem MCP traversal + Playwright runtime verification + Migration SQL inspection

---

## 1. UPDATE BLOCK

**Current Folder Names (as detected in workspace)**:

- **Backend Admin Panel**: `mvm-backend-clone`
- **Public Website**: `test-mvm-official`

⚠️ **IMPORTANT**: These folder names are runtime-detected values and may change. Do NOT hardcode these names in rules or automation. Always detect dynamically via workspace introspection.

---

## 2. QUICK START

### Backend Admin Panel (`mvm-backend-clone`)

**Prerequisites**:

- Node.js (compatible with Next.js 15)
- npm
- Supabase CLI (for local dev)

**Setup**:

```bash
cd mvm-backend-clone
npm install
# Copy .env.example to .env and configure
supabase start  # Start local Supabase instance
npm run dev     # Development server on http://localhost:3000
```

**Login Credentials** (Runtime verified ✓):

- URL: `http://localhost:3000/`
- Email: `superadmin@mvm.com`
- Password: `12345678`

**Source**: `.env.example`, `README.md`, Playwright verification on Jan 19, 2026

### Public Website (`test-mvm-official`)

**Setup**:

```bash
cd test-mvm-official
npm install
# Copy .env.example to .env and configure
npm run dev  # Development server on http://localhost:8080
```

**Source**: `package.json`, `vite.config.ts`

---

## 3. MCP INVENTORY

**Detected MCPs** (via MCP server list):

1. **filesystem** - File system operations (read, write, search, directory traversal)
2. **mcp-playwright** - Browser automation for runtime verification
3. **postgres** - Database introspection
4. **supabase_prod-crm_mvm** - Supabase production instance access

**Capabilities Used**:

- FileSystem: Full repo traversal, file reading, directory tree inspection
- Playwright: Login flow validation, navigation testing, console monitoring
- Supabase: Migration file analysis (direct CLI unavailable, used file-based inspection)

**Source**: MCP server enumeration via Windsurf

---

## 4. WORKSPACE MAP

### Root Structure

```
C:\Users\Mohd Faheem Ansari\MVM Files\_git\
├── mvm-backend-clone/          # Next.js 15 Admin Panel
└── test-mvm-official/          # Vite/React Public Website
```

### Backend Admin Panel (`mvm-backend-clone`)

**Key Directories**:

- `src/app/` - Next.js App Router pages
  - `admin/(protected)/` - Protected admin routes (users, roles, blog, job-posts, audit-logs, settings)
  - `auth/` - Authentication pages (login, forgot-password)
- `src/components/` - React components
  - `features/` - Feature-specific components (blog, job-posts, users, roles, audit, settings)
  - `shared/` - Reusable UI components
- `src/lib/` - Core libraries
  - `dal.ts` - Data Access Layer (authentication/authorization)
  - `supabase/` - Supabase client utilities
  - `permission-constants.ts` - Centralized permission keys
- `src/config/` - Configuration
  - `menu.ts` - Navigation menu and permission mapping
- `supabase/` - Supabase project
  - `migrations/` - SQL migrations (12 files)
  - `functions/` - Edge Functions
  - `config.toml` - Project configuration
- `docs/` - Documentation
  - `CANONICAL_IMPLEMENTATION_STYLE.md` - Implementation blueprint
  - `SECURITY_IMPLEMENTATION.md` - Security architecture guide
- `.windsurf/rules/` - AI assistant rules
  - `project-rules.md` - Project-wide conventions

**Source**: FileSystem MCP directory tree traversal

### Public Website (`test-mvm-official`)

**Key Directories**:

- `src/` - React application source
  - `pages/` - Page components
  - `components/` - UI components
  - `services/` - API services (blogApi.ts, client.ts)
  - `App.tsx` - Main application with routing
  - `main.tsx` - Entry point
- `public/` - Static assets

**Source**: FileSystem MCP directory tree traversal

---

## 5. BUILD/DEV COMMANDS & ENVIRONMENTS

### Backend Admin Panel

**Scripts** (from `package.json`):

- `npm run dev` - Development server (Next.js dev mode)
- `npm run build` - Production build
- `npm run start` - Production server
- `npm run lint` - ESLint check
- `npm run format` - Prettier format
- `npm run format:check` - Prettier check
- `npm run type-check` - TypeScript check

**Environment Variables** (from `.env.example`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL="My Virtual Mate <onboarding@yourdomain.com>"
NEXT_PUBLIC_SITE_URL=http://localhost:3000
MAIN_SITE_URL=["https://myvirtualmate.com","https://myvirtualmate.com.au"]
PREVIEW_URL="https://preview--mvm-official.lovable.app"
```

**Next.js Configuration** (`next.config.js`):

- Remote image patterns for Supabase storage: `*.supabase.co`, `*.supabase.in`
- Server actions body size limit: 10MB
- Experimental features enabled

**TypeScript Configuration** (`tsconfig.json`):

- Strict mode: ✓
- Path alias: `@/*` → `./src/*`
- JSX: react-jsx
- Module resolution: bundler

**Source**: `package.json`, `.env.example`, `next.config.js`, `tsconfig.json`

### Public Website

**Scripts** (from `package.json`):

- `npm run dev` - Development server (Vite)
- `npm run build` - Production build
- `npm run build:dev` - Development build
- `npm run seo:build` - SEO-optimized build with prerendering
- `npm run lint` - ESLint check
- `npm run preview` - Preview production build

**Environment Variables** (from `.env.example`):

```env
VITE_HOST_NAME=https://your-domain.com
VITE_SUPABASE_URL=https://axoogeccvtooichkobqa.supabase.co
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_od22XgqCJe0CCUR_otdDtg_D9Fk4B76
```

**Vite Configuration** (`vite.config.ts`):

- Dev server: `localhost:8080`
- Path alias: `@` → `./src`
- React plugin enabled

**Source**: `package.json`, `.env.example`, `vite.config.ts`

---

## 6. NEXT.JS ARCHITECTURE

### Backend Admin Panel

**Routing Strategy**: Next.js 15 App Router

**Route Structure**:

```
/                           → Public root (Coming Soon page)
/auth/login                 → Login page
/auth/forgot-password       → Password reset
/admin                      → Dashboard (protected)
/admin/users                → User management
/admin/roles                → Role & permission management
/admin/blog/posts           → Blog post management
/admin/blog/categories      → Blog category management
/admin/blog/contributors    → Blog contributor management
/admin/job-posts/posts      → Job post management
/admin/job-posts/categories → Job category management
/admin/audit-logs           → Audit log viewer
/admin/settings/allowed-domains → Domain whitelist management
```

**Source**: `src/app/` directory structure, `src/config/menu.ts`

**Middleware** (`middleware.ts`):

- Protects all `/admin/*` routes (except `/auth/forgot-password`)
- Uses `supabase.auth.getUser()` for JWT validation
- Redirects unauthenticated users to `/` with message
- Matcher: `/admin/:path*`

**Source**: `middleware.ts:1-53`

**Layout Hierarchy**:

1. **Root Layout** (`src/app/layout.tsx`) - Global metadata, font, CSS
2. **Protected Layout** (`src/app/admin/(protected)/layout.tsx`) - Server Component
   - Verifies session via `verifySessionWithProfile()` (DAL)
   - Loads user permissions via `getUserPermissions()` (DAL)
   - Passes data to `AdminLayoutClient` (Client Component)
   - Renders sidebar navigation with permission-based filtering

**Source**: `src/app/layout.tsx:1-17`, `src/app/admin/(protected)/layout.tsx:1-31`

**Data Fetching Pattern**:

- **Server Components**: Primary pattern for data loading
- **Server Actions**: For mutations (create, update, delete)
- **Client Components**: For interactive UI (forms, tables, modals)
- **Zustand**: Client-side state management (UI state, not data persistence)

**Source**: `docs/CANONICAL_IMPLEMENTATION_STYLE.md:1-379`, `README.md:1-300`

**Component Architecture**:

```
Server Component (page.tsx)
  ↓ Fetch data via DAL
  ↓ Check permissions via DAL
  ↓ Pass data as props
Client Component (*Client.tsx)
  ↓ Manage UI state (Zustand)
  ↓ Handle user interactions
  ↓ Call Server Actions
```

**Example**: Blog Posts

- Server: `src/app/admin/(protected)/blog/posts/page.tsx` - Fetches posts
- Client: `src/components/features/blog/BlogPostsClient.tsx` - Renders UI, handles actions

**Source**: `docs/CANONICAL_IMPLEMENTATION_STYLE.md:40-120`

---

## 7. SUPABASE INTEGRATION

### Backend Admin Panel

**Configuration** (`supabase/config.toml`):

- Project ID: `jrtpzvmxwpxkffyloibt`
- Auth enabled: ✓
- Edge Functions: 8 functions with `verify_jwt = false` (public or self-managed auth)

**Source**: `supabase/config.toml:1-23`

**Client Utilities**:

**Server-Side** (`src/lib/supabase/server.ts`):

- `createClient()` - Server Component/Action client (anon key, cookie-based)
- `createAdminClient()` - Service role client (NEVER exposed to browser)

**Client-Side** (`src/lib/supabase/client.ts`):

- `createClient()` - Browser client (anon key)

**Source**: `src/lib/supabase/server.ts:1-41`, `src/lib/supabase/client.ts:1-7`

### Database Schema (from Migrations)

**Core Tables** (12 migrations analyzed):

**1. User Management** (`20241205000002_create_user_tables.sql`):

- `user_roles` - Role definitions (Super Admin, Admin, Manager)
  - Unique constraint: Only ONE `is_super_admin = true`
- `users` - User profiles (linked to `auth.users`)
- `user_permissions` - Permission definitions
- `user_role_permissions` - Many-to-many role-permission mapping
- `user_audit_logs` - Audit trail
- `user_invitations` - Email invitation system
- `user_password_reset_tokens` - Password reset flow

**Source**: `supabase/migrations/20241205000002_create_user_tables.sql:1-161`

**2. Blog Module** (`20241205000003_create_blog_tables.sql`):

- `blog_categories` - Blog categories with `post_count` trigger
- `blog_contributors` - Author profiles
- `blog_posts` - Blog content
  - Fields: `title`, `slug`, `content`, `excerpt`, `cover_image_url`, `status`, `published_at`
  - SEO: `seo_title`, `seo_description`, `meta_keywords`, `og_image_url`, `canonical_url`
  - Relationships: `category_id`, `contributor_id`, `created_by`, `updated_by`

**Source**: `supabase/migrations/20241205000003_create_blog_tables.sql:1-82`

**3. Job Posts Module** (`20260117041400_create_job_posts_tables.sql`):

- `job_categories` - Job categories with `post_count` trigger
- `job_posts` - Job listings
  - Enums: `job_status`, `employment_type_enum`, `location_type_enum`
  - Fields: `title`, `slug`, `job_id`, `category_id`, `location`, `location_type`, `employment_type`, `experience_level`
  - Salary: `salary_min`, `salary_max`, `salary_currency`, `salary_period`, `show_salary`
  - Content: `responsibilities` (jsonb array), `requirements` (jsonb array), `nice_to_have` (jsonb array)
  - SEO: `seo_title`, `seo_description`, `meta_keywords`, `jsonld_schema`
  - Status: `status`, `published_at`, `expires_at`, `is_featured`
  - Triggers: `updated_at`, `published_at`, `post_count`

**Source**: `supabase/migrations/20260117041400_create_job_posts_tables.sql:1-192`

**4. Storage Buckets** (`20241205000006_create_storage_buckets.sql`):

- `user-avatars` - User profile images (owner-only write, public read)
- `blog-cover-images` - Blog post covers (authenticated write, public read)
- `blog-contributor-avatars` - Contributor images (authenticated write, public read)

**Source**: `supabase/migrations/20241205000006_create_storage_buckets.sql:1-86`

**Row Level Security (RLS)**:

**Enabled on all tables** (`20241205000005_enable_rls_policies.sql`):

- User tables: Authenticated users read, service role full access, users update own profile
- Blog tables: Authenticated users read, service role full access
- Job tables: Authenticated users read, service role full access
- Storage buckets: Granular policies per bucket

**Source**: `supabase/migrations/20241205000005_enable_rls_policies.sql:1-128`

### RBAC Schema

**Permissions** (from `20260116072704_complete_rbac_reset_v3.sql`):

**Users Module**:

- `users.view` - View users
- `users.edit` - Edit users

**Roles Module**:

- `roles.view` - View roles
- `roles.edit` - Edit roles

**Blog Module**:

- `blog-posts.view` - View blog posts
- `blog-posts.edit` - Edit blog posts
- `blog-posts.publish` - Publish blog posts
- `blog-posts.delete` - Delete blog posts

**Job Posts Module**:

- `job-posts.view` - View job posts
- `job-posts.edit` - Edit job posts
- `job-posts.publish` - Publish job posts
- `job-posts.delete` - Delete job posts

**Audit Module**:

- `audit-logs.view` - View audit logs

**Settings Module**:

- `settings.view` - View settings
- `settings.edit` - Edit settings

**Role Assignments**:

- **Admin**: All 15 permissions
- **Manager**: 8 permissions (users.view, roles.view, blog-posts.\*, job-posts.view/edit, audit-logs.view, settings.view)
- **Super Admin**: Hardcoded bypass (no DB permissions needed)

**Source**: `supabase/migrations/20260116072704_complete_rbac_reset_v3.sql:1-239`, `src/lib/permission-constants.ts:1-68`

---

## 8. DOMAIN MODEL & RBAC

### User Roles

**1. Super Admin** (Immutable):

- Single instance (enforced by DB unique constraint)
- Full system access (hardcoded bypass)
- Cannot be deleted or have role changed
- Default email: `superadmin@mvm.com`

**2. Admin**:

- Full permissions (15 total)
- Can manage users, roles, blog, job posts, audit logs, settings

**3. Manager**:

- Limited permissions (8 total)
- Can view users/roles, manage blog posts, view/edit job posts, view audit logs/settings

**Source**: `supabase/migrations/20241205000002_create_user_tables.sql:1-30`, `supabase/migrations/20260116072704_complete_rbac_reset_v3.sql:200-239`

### Permission Enforcement

**Multi-Layer Security**:

**Layer 1: Middleware** (`middleware.ts`)

- UX layer (not primary security)
- Redirects unauthenticated users
- Uses `supabase.auth.getUser()` for JWT validation

**Layer 2: Data Access Layer (DAL)** (`src/lib/dal.ts`)

- **Security layer** (primary enforcement)
- Functions:
  - `verifySession()` - Validates session, throws if invalid
  - `getCurrentUser()` - Gets authenticated user
  - `getUserProfile()` - Gets user + role + permissions
  - `isSuperAdmin()` - Checks Super Admin status
  - `getUserPermissions()` - Loads permission array
  - `hasPermission(key)` - Checks single permission
  - `requirePermission(key)` - Throws if missing
- Uses React `cache()` for request-scoped memoization
- **CRITICAL**: Always uses `supabase.auth.getUser()` (not `getSession()`)

**Layer 3: Row Level Security (RLS)**

- Data layer (final enforcement)
- Database-level policies on all tables
- Prevents unauthorized data access even if app code bypassed

**Source**: `docs/SECURITY_IMPLEMENTATION.md:1-100`, `src/lib/dal.ts:1-283`

### Code-Defined Navigation

**Single Source of Truth**: `src/config/menu.ts`

**Structure**:

```typescript
export const MENU_CONFIG: MenuItem[] = [
  {
    id: 'users',
    label: 'Users',
    path: '/admin/users',
    icon: Users,
    permissionKey: Permissions.USERS_VIEW,
  },
  {
    id: 'blog',
    label: 'Blog',
    icon: FileText,
    children: [
      {
        id: 'blog-posts',
        label: 'Posts',
        path: '/admin/blog/posts',
        icon: FileText,
        permissionKey: Permissions.BLOG_POSTS_VIEW,
        relatedPermissions: [
          Permissions.BLOG_POSTS_EDIT,
          Permissions.BLOG_POSTS_PUBLISH,
          Permissions.BLOG_POSTS_DELETE,
        ],
      },
      // ...
    ],
  },
  // ...
]
```

**Purpose**:

- Defines all navigation items
- Maps permissions to menu items
- Used by `getAllMenuPermissions()` to sync DB permissions
- Filtered by user permissions in client UI

**Source**: `src/config/menu.ts:1-191`, `.windsurf/rules/project-rules.md:80-90`

---

## 9. CODE QUALITY & CONVENTIONS

### TypeScript Standards

**Strict Mode**: Enabled

- `strict: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noFallthroughCasesInSwitch: true`

**Source**: `tsconfig.json:1-26`

### Naming Conventions

**Files**:

- Server Components: `page.tsx`, `layout.tsx`
- Client Components: `*Client.tsx` suffix
- Server Actions: `actions.ts`
- Types: `*.ts` in `src/types/`

**Components**:

- PascalCase for component names
- camelCase for functions/variables
- UPPER_SNAKE_CASE for constants

**Source**: `docs/CANONICAL_IMPLEMENTATION_STYLE.md:60-80`

### Styling

**Framework**: Tailwind CSS

- Utility-first approach
- No custom CSS unless absolutely necessary
- Consistent spacing scale

**Source**: `docs/CANONICAL_IMPLEMENTATION_STYLE.md:250-270`, `.windsurf/rules/project-rules.md:150-160`

### Error Handling

**Server Actions**:

```typescript
try {
  // Action logic
  return { success: true, data }
} catch (error) {
  console.error('Action failed:', error)
  return { success: false, error: 'User-friendly message' }
}
```

**Client Components**:

- Display error states with clear messages
- Use `toast` notifications for user feedback

**Source**: `docs/CANONICAL_IMPLEMENTATION_STYLE.md:150-180`

### Type Safety

**Database Types**:

- Generated from Supabase schema
- Exported from `src/types/`
- Used throughout application

**Example**: `src/types/blog.ts`, `src/types/job-posts.ts`

**Source**: `src/types/blog.ts:1-155`, `src/types/job-posts.ts:1-128`

---

## 10. RULES-READY CONVENTIONS

### For AI-Assisted Development

**1. Feature Implementation Checklist**:

When adding a new module (e.g., similar to Blog or Job Posts):

**Database**:

- [ ] Create migration SQL with tables, enums, triggers
- [ ] Enable RLS and define policies
- [ ] Add permissions to `user_permissions` table
- [ ] Assign permissions to roles

**Types**:

- [ ] Create `src/types/[feature].ts` with DB-aligned interfaces
- [ ] Export form types, filter types, validation types

**Permissions**:

- [ ] Add permission constants to `src/lib/permission-constants.ts`
- [ ] Add to `PermissionGroups` for easier management

**Menu**:

- [ ] Add menu items to `src/config/menu.ts`
- [ ] Map permissions to navigation items
- [ ] Run permission sync to DB

**Server Actions**:

- [ ] Create `src/app/admin/(protected)/[feature]/actions.ts`
- [ ] Use DAL for authentication/authorization
- [ ] Return `{ success, data/error }` format

**Components**:

- [ ] Create Server Component page for data fetching
- [ ] Create Client Component for UI rendering
- [ ] Use Zustand for client state (if needed)
- [ ] Implement error/loading states

**Routes**:

- [ ] Create `/admin/[feature]/` directory structure
- [ ] Implement list, create, edit, delete pages

**Source**: `docs/CANONICAL_IMPLEMENTATION_STYLE.md:300-379`

**2. Security Rules**:

**ALWAYS**:

- Use `supabase.auth.getUser()` (not `getSession()`)
- Verify permissions in Server Components/Actions via DAL
- Enable RLS on all tables
- Use service role client ONLY in Server Actions (never expose to browser)

**NEVER**:

- Trust client-side data without server validation
- Bypass DAL permission checks
- Use `getSession()` for security-critical operations
- Hardcode permissions in components (use `menu.ts`)

**Source**: `docs/SECURITY_IMPLEMENTATION.md:1-100`, `.windsurf/rules/project-rules.md:100-140`

**3. Code Style Rules**:

**Components**:

- Prefer Server Components for data fetching
- Use Client Components only when needed (interactivity, state)
- Extract reusable UI to `src/components/shared/`

**State Management**:

- Server state: Fetch in Server Components, pass as props
- Client state: Zustand stores for UI state only
- Form state: React Hook Form or native state

**Styling**:

- Tailwind utility classes only
- Consistent spacing: `p-4`, `gap-4`, `space-y-4`
- Responsive: `sm:`, `md:`, `lg:` breakpoints

**Source**: `.windsurf/rules/project-rules.md:140-180`

**4. Folder-Name Agnostic Rules**:

When writing automation or rules:

- ❌ DON'T: Hardcode `mvm-backend-clone` or `test-mvm-official`
- ✅ DO: Detect dynamically via workspace root or app characteristics
- ✅ DO: Use heuristics (package.json, Next.js vs Vite, etc.)

**Source**: User requirements (Update Block instruction)

---

## 11. RUNTIME VERIFICATION

**Method**: Playwright MCP browser automation  
**Date**: January 19, 2026  
**Target**: http://localhost:3000

### Login Flow ✓

**Steps**:

1. Navigate to `http://localhost:3000/`
2. Redirected to login page (unauthenticated)
3. Enter credentials:
   - Email: `superadmin@mvm.com`
   - Password: `12345678`
4. Submit form
5. Successfully logged in
6. Redirected to `/admin` (Dashboard)

**Verification**: ✓ Login successful, session established

### Navigation Testing ✓

**Pages Verified**:

- `/admin` - Dashboard (✓ Loaded)
- `/admin/users` - User management (✓ Loaded)
- `/admin/blog/posts` - Blog posts (✓ Loaded, 2 posts visible)
- `/admin/job-posts/posts` - Job posts (✓ Loaded, 2 posts visible)

**Menu Items Verified**:

- Dashboard (✓)
- Users (✓)
- Roles & Permissions (✓ Visible)
- Blog → Posts, Categories, Contributors (✓)
- Job Posts → Posts (✓)
- Audit Logs (✓ Visible)
- Settings → Allowed Domains (✓ Visible)

**Permissions Visible**: All menu items visible for Super Admin (expected behavior)

### Data Validation ✓

**Blog Posts**:

- Total: 2 posts
- Statuses: Draft (1), Published (1)
- Filters: Status, Category, Contributor (working)
- Actions: Edit, Publish/Unpublish, Delete (visible)

**Job Posts**:

- Total: 2 posts
- Job IDs: JOB-641754, JOB-232379
- Employment Types: Full-Time, project based
- Filters: Status, Employment Type, Category (working)
- Actions: Edit, Unpublish (visible)

**Console**: No errors detected

**Source**: Playwright MCP browser automation outputs

---

## 12. OPEN QUESTIONS / UNKNOWNS

**None at this time**. All major claims in this report are grounded in:

- FileSystem MCP file reads
- Migration SQL inspection
- Playwright runtime verification
- Package.json and configuration file analysis

**Unverified Details** (intentionally not claimed):

- Live Supabase schema (Supabase CLI not accessible; relied on migration files)
- Actual production URLs (only example values in `.env.example`)
- Email delivery (Resend integration exists but not runtime tested)
- Public website runtime behavior (dev server on port 8080 not verified)

**Verification Steps** (if needed):

1. **Live Schema**: Run `supabase db inspect` to validate current database state
2. **Production URLs**: Check production `.env` file (not in repo)
3. **Email**: Test invitation flow with real Resend API key
4. **Public Website**: Start `npm run dev` in `test-mvm-official` and test at `http://localhost:8080`

---

## APPENDIX: FILE REFERENCES

### Configuration Files

- `C:\Users\Mohd Faheem Ansari\MVM Files\_git\mvm-backend-clone\package.json`
- `C:\Users\Mohd Faheem Ansari\MVM Files\_git\mvm-backend-clone\next.config.js`
- `C:\Users\Mohd Faheem Ansari\MVM Files\_git\mvm-backend-clone\tsconfig.json`
- `C:\Users\Mohd Faheem Ansari\MVM Files\_git\mvm-backend-clone\.env.example`
- `C:\Users\Mohd Faheem Ansari\MVM Files\_git\mvm-backend-clone\supabase\config.toml`
- `C:\Users\Mohd Faheem Ansari\MVM Files\_git\test-mvm-official\package.json`
- `C:\Users\Mohd Faheem Ansari\MVM Files\_git\test-mvm-official\vite.config.ts`
- `C:\Users\Mohd Faheem Ansari\MVM Files\_git\test-mvm-official\.env.example`

### Core Implementation Files

- `C:\Users\Mohd Faheem Ansari\MVM Files\_git\mvm-backend-clone\middleware.ts`
- `C:\Users\Mohd Faheem Ansari\MVM Files\_git\mvm-backend-clone\src\lib\dal.ts`
- `C:\Users\Mohd Faheem Ansari\MVM Files\_git\mvm-backend-clone\src\lib\supabase\server.ts`
- `C:\Users\Mohd Faheem Ansari\MVM Files\_git\mvm-backend-clone\src\lib\supabase\client.ts`
- `C:\Users\Mohd Faheem Ansari\MVM Files\_git\mvm-backend-clone\src\lib\permission-constants.ts`
- `C:\Users\Mohd Faheem Ansari\MVM Files\_git\mvm-backend-clone\src\config\menu.ts`
- `C:\Users\Mohd Faheem Ansari\MVM Files\_git\mvm-backend-clone\src\app\layout.tsx`
- `C:\Users\Mohd Faheem Ansari\MVM Files\_git\mvm-backend-clone\src\app\admin\(protected)\layout.tsx`

### Type Definitions

- `C:\Users\Mohd Faheem Ansari\MVM Files\_git\mvm-backend-clone\src\types\blog.ts`
- `C:\Users\Mohd Faheem Ansari\MVM Files\_git\mvm-backend-clone\src\types\job-posts.ts`

### Migrations (chronological)

1. `C:\Users\Mohd Faheem Ansari\MVM Files\_git\mvm-backend-clone\supabase\migrations\20241205000002_create_user_tables.sql`
2. `C:\Users\Mohd Faheem Ansari\MVM Files\_git\mvm-backend-clone\supabase\migrations\20241205000003_create_blog_tables.sql`
3. `C:\Users\Mohd Faheem Ansari\MVM Files\_git\mvm-backend-clone\supabase\migrations\20241205000005_enable_rls_policies.sql`
4. `C:\Users\Mohd Faheem Ansari\MVM Files\_git\mvm-backend-clone\supabase\migrations\20241205000006_create_storage_buckets.sql`
5. `C:\Users\Mohd Faheem Ansari\MVM Files\_git\mvm-backend-clone\supabase\migrations\20260116072704_complete_rbac_reset_v3.sql`
6. `C:\Users\Mohd Faheem Ansari\MVM Files\_git\mvm-backend-clone\supabase\migrations\20260117041400_create_job_posts_tables.sql`

### Documentation

- `C:\Users\Mohd Faheem Ansari\MVM Files\_git\mvm-backend-clone\README.md`
- `C:\Users\Mohd Faheem Ansari\MVM Files\_git\mvm-backend-clone\docs\CANONICAL_IMPLEMENTATION_STYLE.md`
- `C:\Users\Mohd Faheem Ansari\MVM Files\_git\mvm-backend-clone\docs\SECURITY_IMPLEMENTATION.md`
- `C:\Users\Mohd Faheem Ansari\MVM Files\_git\mvm-backend-clone\.windsurf\rules\project-rules.md`

### Public Website Key Files

- `C:\Users\Mohd Faheem Ansari\MVM Files\_git\test-mvm-official\src\App.tsx`
- `C:\Users\Mohd Faheem Ansari\MVM Files\_git\test-mvm-official\src\main.tsx`
- `C:\Users\Mohd Faheem Ansari\MVM Files\_git\test-mvm-official\src\services\blogApi.ts`
- `C:\Users\Mohd Faheem Ansari\MVM Files\_git\test-mvm-official\src\services\client.ts`

---

**Report End** | Generated via FileSystem MCP + Playwright MCP + Migration Analysis
