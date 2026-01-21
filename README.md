# My Virtual Mate - Backend Admin Panel

Internal administrative platform for managing users, roles, permissions, and blog content with a strict RBAC system.

## Features

- **Secure Authentication** - Invitation-only access via Supabase Auth with password reset flow
- **User Management** - Complete CRUD operations for admin users with invitation system
- **Role-Based Access Control** - Dynamic permissions with code-driven navigation
- **Blog Management** - Full CMS for posts, categories, and contributors with rich text editing
- **Job Posts Module** - End-to-end admin workflows for job categories, listings, publishing, and copy-ready preview/live links with rich text authoring for responsibilities, skills, and benefits
- **Email Integration** - Automated invitations and password reset via Resend
- **Super Admin** - Single immutable admin with full privileges
- **Audit Logging** - Comprehensive tracking of all actions

## Tech Stack

| Category             | Technology                   |
| -------------------- | ---------------------------- |
| **Framework**        | Next.js 15 (App Router)      |
| **Language**         | TypeScript (Strict Mode)     |
| **UI**               | React 19                     |
| **Styling**          | Tailwind CSS                 |
| **Database**         | Supabase PostgreSQL with RLS |
| **Authentication**   | Supabase Auth                |
| **State Management** | Zustand                      |
| **Rich Text Editor** | Tiptap                       |
| **Icons**            | Lucide React                 |
| **Email**            | Resend API                   |
| **Deployment**       | Vercel                       |

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm, yarn, or pnpm
- Supabase account
- Resend account

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd my-virtual-mate
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.local.example .env.local
```

4. Configure `.env.local` with your credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Resend Email API
RESEND_API_KEY=your-resend-api-key

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Preview URLs
BLOG_PREVIEW_URL="https://preview--mvm-official.lovable.app"
JOB_PREVIEW_URL="https://preview--mvm-official.lovable.app"
```

5. Run database migrations (see `supabase/migrations/` folder)

6. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
my-virtual-mate/
├── docs/                               # Living architecture & security references
│   ├── DAL_MIGRATION_GUIDE.md
│   └── SECURITY_IMPLEMENTATION.md
├── AGENT.md                            # In-repo assistant operating guide
├── PROJECT_ANALYSIS_REPORT.md          # Workspace + infra discovery report
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── audit-logs/
│   │   │   ├── blog/
│   │   │   ├── job-posts/                # Job post CRUD & category management
│   │   │   │   ├── posts/               # List, detail, create flows
│   │   │   │   └── categories/          # Category list + detail pages
│   │   │   ├── roles/
│   │   │   └── users/
│   │   └── auth/
│   ├── actions/
│   │   ├── job-posts.ts
│   │   └── job-categories.ts
│   ├── components/
│   │   └── features/job-posts/          # JobPostList, JobPostForm, JobUrlDisplay, Category UI
│   ├── config/
│   │   └── menu.ts
│   ├── lib/
│   │   ├── job-posts/                   # Domain helpers + validations
│   │   └── audit.ts
│   └── types/
│       └── job-posts.ts
├── supabase/
│   ├── functions/
│   │   ├── job-get-post/
│   │   └── job-list-posts/
│   └── migrations/
└── middleware.ts
```

### Job Posts Module Overview

- Full CRUD for job categories and posts powered by strict permissions (`job-posts.view/edit/publish/delete`).
- Dedicated admin pages for list, detail, and form flows with audit logging for every mutation.
- Automatic SEO + JSON-LD enrichment, preview URL generation, and publish validation helpers.
- Supabase Edge Functions (`job-list-posts`, `job-get-post`) expose a read-only API for the public site to consume jobs without leaking admin credentials.
- Sequential `JOB-000001` style IDs with collision-safe generation keep records human-friendly while remaining unique.
- Inline TipTap editors persist HTML for responsibilities, must-have skills, preferred skills, and benefits so publishing validations run against real formatted content instead of arrays.

## Scripts

| Command                    | Description                                   |
| -------------------------- | --------------------------------------------- |
| `npm run dev`              | Start development server                      |
| `npm run build`            | Build for production (auto-syncs permissions) |
| `npm run start`            | Start production server                       |
| `npm run sync-permissions` | Sync permissions from menu config to database |
| `npm run lint`             | Run ESLint                                    |
| `npm run format`           | Format code with Prettier                     |
| `npm run format:check`     | Check code formatting                         |
| `npm run type-check`       | Check TypeScript types                        |

## Branding

- **Primary Color**: MVM Blue `#025fc7`
- **Accent Color**: MVM Yellow `#ba9309`
- **Gradient**: Linear gradient from blue to yellow

## Database Schema

### Core Tables

- `profiles` - Admin user profiles linked to Supabase Auth
- `roles` - User roles with Super Admin constraint
- `permissions` - Permission definitions synced from code
- `role_permissions` - Role-permission mappings

### Content Tables

- `blog_categories` - Blog post categories
- `blog_contributors` - Blog authors and contributors
- `blog_posts` - Blog post content with rich text

### Job Tables

- `job_categories` - Lightweight taxonomy for grouping job posts (name + counts)
- `job_posts` - Complete job listing record including SEO metadata, salary data, HTML content blocks (responsibilities, must_have_skills, preferred_skills, benefits), publisher tracking, and structured schema payloads

### System Tables

- `user_invitations` - Pending user invitations
- `password_reset_tokens` - Password reset tokens
- `audit_logs` - Action audit trail

## Security

This project implements **industry-standard authentication and authorization** following Next.js 15 and Supabase best practices:

- **Data Access Layer (DAL)** - Centralized auth verification with JWT validation
- **Multi-layered Security** - Middleware (UX) → DAL (Security) → RLS (Data)
- **JWT Validation** - Always uses `getUser()` to validate with Auth server (never trusts cookies)
- **Row Level Security (RLS)** - Enabled on all tables with proper policies
- **Immutable Super Admin** - Cannot be edited or deleted
- **Server-side mutations** - All data changes go through Server Actions
- **Secure tokens** - Invitation and password reset tokens with expiration
- **React cache()** - Optimized performance with memoized auth checks

### Security Documentation

- **`docs/SECURITY_IMPLEMENTATION.md`** - Complete security architecture and patterns
- **`docs/DAL_MIGRATION_GUIDE.md`** - Migration guide for using the DAL

### Operational Documentation

- **`AGENT.md`** - Active guardrails + expectations for assistants working in this repo
- **`PROJECT_ANALYSIS_REPORT.md`** - Snapshot of current workspace layout, tooling, and verification steps

### Quick Security Example

```typescript
// Server Component
import { verifySessionWithProfile, hasPermission } from '@/lib/dal'

export default async function UsersPage() {
  const profile = await verifySessionWithProfile() // Validates JWT
  const canCreate = await hasPermission('users.create')

  return <UsersList currentUser={profile} canCreate={canCreate} />
}

// Server Action
'use server'
import { verifySession, requirePermission } from '@/lib/dal'

export async function deleteUser(userId: string) {
  await verifySession()
  await requirePermission('users.delete')
  // Proceed with deletion
}
```

## License

Proprietary - All rights reserved MVM
