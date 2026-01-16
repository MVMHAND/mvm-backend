# My Virtual Mate - Backend Admin Panel

Internal administrative platform for managing users, roles, permissions, and blog content with a strict RBAC system.

## Features

- **Secure Authentication** - Invitation-only access via Supabase Auth with password reset flow
- **User Management** - Complete CRUD operations for admin users with invitation system
- **Role-Based Access Control** - Dynamic permissions with code-driven navigation
- **Blog Management** - Full CMS for posts, categories, and contributors with rich text editing
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
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/              # Admin panel routes
│   │   │   ├── audit-logs/     # Audit log viewer
│   │   │   ├── blog/           # Blog management
│   │   │   │   ├── categories/ # Blog categories CRUD
│   │   │   │   ├── contributors/ # Blog contributors CRUD
│   │   │   │   └── posts/      # Blog posts CRUD
│   │   │   ├── forgot-password/ # Password reset request
│   │   │   ├── login/          # Admin login
│   │   │   ├── roles/          # Role management
│   │   │   └── users/          # User management
│   │   └── auth/               # Auth callback routes
│   │       ├── accept-invitation/ # Invitation acceptance
│   │       ├── callback/       # OAuth callback
│   │       ├── reset-password/ # Password reset
│   │       └── setup-password/ # Initial password setup
│   ├── actions/                # Server Actions
│   │   ├── audit.ts            # Audit log actions
│   │   ├── auth.ts             # Authentication actions
│   │   ├── blog-categories.ts  # Blog category actions
│   │   ├── blog-contributors.ts # Blog contributor actions
│   │   ├── blog-posts.ts       # Blog post actions
│   │   ├── invitations.ts      # User invitation actions
│   │   ├── roles.ts            # Role management actions
│   │   └── users.ts            # User management actions
│   ├── components/
│   │   ├── features/           # Feature-specific components
│   │   ├── layout/             # Layout components (Sidebar, Header)
│   │   └── ui/                 # Reusable UI components
│   ├── config/
│   │   └── menu.ts             # Navigation menu configuration
│   ├── lib/
│   │   ├── blog/               # Blog utilities
│   │   ├── supabase/           # Supabase client configurations
│   │   ├── audit.ts            # Audit logging utilities
│   │   ├── constants.ts        # App constants
│   │   ├── dal.ts              # ⭐ Data Access Layer (Auth/Authz)
│   │   ├── email.ts            # Email templates and sending
│   │   ├── permissions.ts      # Permission utilities (deprecated)
│   │   └── utils.ts            # General utilities
│   ├── store/                  # Zustand state management
│   │   ├── slices/             # Store slices
│   │   ├── middleware/         # Store middleware
│   │   ├── index.ts            # Store configuration
│   │   └── provider.tsx        # Store provider
│   └── types/                  # TypeScript type definitions
├── scripts/
│   └── sync-permissions.ts     # Deploy-time permission sync
├── supabase/
│   └── migrations/             # Database migration files
├── public/                     # Static assets
├── middleware.ts               # Route protection middleware
├── SECURITY_IMPLEMENTATION.md  # Security architecture guide
└── DAL_MIGRATION_GUIDE.md      # DAL migration & usage guide
```

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

### Blog Tables

- `blog_categories` - Blog post categories
- `blog_contributors` - Blog authors and contributors
- `blog_posts` - Blog post content with rich text

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

- **`SECURITY_IMPLEMENTATION.md`** - Complete security architecture and patterns
- **`DAL_MIGRATION_GUIDE.md`** - Migration guide for using the DAL
- **`DAL_IMPLEMENTATION_SUMMARY.md`** - Implementation overview and status

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
