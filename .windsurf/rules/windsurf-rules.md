---
trigger: always_on
---

# My Virtual Mate – Windsurf Rules

Use this document as the single source of truth when implementing, refactoring, or discussing code for this project.

---

## 1. Product & Project Overview

- **Product**

  - Internal admin panel: _My Virtual Mate – Backend Panel_
  - Minimal public “Coming Soon” website at `/`

- **Core vision**

  - Strong, DB-backed **RBAC** with exactly **one immutable Super Admin**.
  - Menu/navigation defined **in code** (typed config), while **permissions are dynamic & DB‑driven**.
  - Secure, maintainable admin panel that can evolve without schema churn for navigation.

- **No public signup**

  - Only **login** for admin users.
  - Admins are **invited** via email (Resend) by existing admins.

- **Primary success criteria**
  - Roles/permissions configurable via UI (no DB/schema edits for day‑to‑day changes).
  - Exactly one Super Admin at all times; cannot be edited or deleted.
  - Adding a new section = update menu config + add route/component + sync permissions.

---

## 2. Tech Stack & Architecture

- **Frontend**

  - Next.js **App Router** in `app/` (Next.js **15**).
  - React **19**.
  - TypeScript, **strict mode** enabled.
  - Tailwind CSS for styling.
  - All components are **Server Components by default**; use `"use client"` only when really needed.

- **Backend / Platform**

  - Supabase:
    - Postgres (primary DB).
    - Supabase Auth (for admin identities and sessions).
    - Supabase Storage (avatars and files).
    - Row Level Security (RLS) on all business tables.
  - Email: **Resend** API for all system emails.
  - Hosting: Next.js app on Vercel (or similar) + Supabase for DB/Auth/Storage.

- **State management**
  - Server Components + Server Actions for data and mutations.
  - Zustand for client‑side UI state only.
  - React Context only for authentication state.

---

## 3. High-Level Functional Scope

### 3.1 Public Website (`/`)

- Minimal “Coming Soon” page:
  - Logo/branding, tagline, short description.
  - Optional future: email capture/contact form (can be out of scope for v1).

### 3.2 Admin Authentication

- **Routes**

  - `/admin/login` – email + password login only.
  - No **self‑service signup** page.

- **Flows**

  - Login via Supabase Auth (email + password).
  - “Forgot password” triggers Supabase reset flow (email with secure link).
  - All `/admin/**` routes must be **protected via middleware + server-side checks**.

- **Sessions & security**
  - Use Supabase Auth session handling with the **App Router** (middleware + server/client helpers).
  - Short session duration / idle timeout (configurable).
  - Refresh tokens handled by Supabase; never expose service keys to the client.

---

## 4. Users, Roles & Permissions

### 4.1 User Types

- **Super Admin (single instance)**

  - Has **full access** to all current and future features.
  - **Immutable**:
    - Cannot be edited or deleted from UI.
    - Cannot change email, name, role, status.
    - DB constraints must also enforce this (not only UI).

- **Admin Panel User**
  - Internal user with:
    - Role (Admin, Manager, Support, etc.).
    - Permissions via `role_permissions` matrix.
  - Can act only if their effective permissions allow it.

### 4.2 User Data Model (Admin Panel Profile)

For each admin user profile:

- `name` – full name.
- `email` – unique, login identifier.
- `avatar_url` – optional, stored in Supabase Storage.
- `status` – enum: `active`, `inactive`, `deleted` (soft delete).
- `role_id` – foreign key to `roles` table (Super Admin still respects uniqueness constraint).

Auth identity is stored in Supabase Auth’s `auth.users` table. A `profiles` table links via `user_id`.

### 4.3 Roles Model

- `roles` table:
  - Fields: `id`, `name`, `description`, `is_super_admin` (boolean), `is_system` (for protected roles), timestamps.
  - **Exactly one** row with `is_super_admin = true` (enforced via DB constraint).

### 4.4 Permissions Model

- Permissions defined **in code** as `permission_key` strings:
  - Examples: `users.view`, `users.invite`, `users.edit`, `roles.manage`, `settings.view`, etc.
- DB tables:
  - `permissions`:
    - Stores each `permission_key` + human label + description + grouping info.
  - `role_permissions`:
    - Associates `role_id` with one or more permission keys.
    - Can include CRUD flags (`can_view`, `can_create`, `can_update`, `can_delete`) if needed.

#### Synchronization

- On deployment/migration:
  - Sync code-defined permission keys into the `permissions` table **idempotently**.
  - Do not auto‑delete old keys; flag for cleanup instead.

### 4.5 Super Admin Handling

- Super Admin **bypasses** `role_permissions`:
  - Treated as having all permissions.
- UI must:
  - Clearly show that Super Admin role and its assigned user are immutable.
  - Block any operation that could remove or duplicate Super Admin.

---

## 5. Navigation & Menu (Code‑Defined)

- Menu lives in code, e.g. `config/menu.ts` or equivalent.

- **Menu item structure** (typed config object):

  - `id`: stable, unique key.
  - `label`: display name.
  - `path`: route path.
  - `icon`: optional UI icon reference.
  - `children`: nested menu items.
  - `permissionScope` / `featureKey`: ties menu item to permission(s).

- **Rendering**

  - Sidebar and any nested navigation are **driven entirely** from this config.
  - There should be **no menu/navigation tables** in the DB.

- **Adding a new feature/section**
  - Update `MENU_CONFIG` with new entry.
  - Create corresponding route + page/component.
  - Add permission keys in code and ensure they are synced into `permissions` table.

---

## 6. Email Integration (Resend)

- Use Resend for:

  - Admin invitation emails (primary for v1).
  - Optional alerts to Super Admin (e.g., new admin created, role permissions changed).

- Requirements:
  - All email logic wrapped in a server module (e.g., `lib/email.ts`).
  - Centralize templates and providers to allow easy switching later.
  - Brand emails with:
    - MVM Blue `#025fc7` and MVM Yellow `#ba9309`.
    - Responsive design for mobile.
  - Do **not** expose internal admin URLs directly without secure tokens.

---

## 7. Audit Logging & Security

### 7.1 Audit Logging

- Log at least:

  - User creation, updates, role changes, status changes, delete/soft-delete.
  - Role creation, deletion, permission matrix changes.
  - Login success/failure for admin users.

- Each log entry includes:
  - Actor user ID.
  - Action type.
  - Target type (user, role, permission, etc.).
  - Target ID.
  - Timestamp.
  - Metadata JSON (for details, previous/new values, etc.).

### 7.2 Security & RLS

- Enable **Row Level Security** on all business tables.
- Implement policies to restrict:
  - Reads and writes to what a user is allowed to see/do.
  - Incorporate role and effective permissions into the logic.
- All mutations:

  - Must go through **server-side code** (Server Actions / API routes).
  - The frontend must never call privileged PostgREST endpoints directly using service-level keys.

- Secrets:
  - Use environment variables for Supabase keys and Resend API keys.
  - Keep anon/public and service role keys strictly separated.
  - Never expose service-level keys to the browser.

---

## 8. Frontend Implementation Rules

### 8.1 Routing & Components

- Use **App Router** under `src/app/`.
- Pages:
  - Use `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx` as per Next.js 15 conventions.
- Prefer **Server Components**:
  - Data fetching via Supabase server client in Server Components.
  - Use Client Components (`"use client"`) only when:
    - You need interactivity (forms, modals, local state, etc.).
    - You rely on browser-only APIs or client-only libraries.

### 8.2 State Management

- Client-side UI state:
  - Use Zustand for global UI (sidebar open, theme, etc.).
  - Co-located `useState` for simple local state.
- Auth state:
  - Use React Context for authenticated user info where needed.
- Server state:
  - Fetch in Server Components or Server Actions; **don’t** build a client-heavy data fetching layer.

### 8.3 Styling & Design

- **Tailwind CSS**:

  - Keep global styles in `app/globals.css`.
  - Use utility classes primarily.
  - CSS Modules only for complex, component-specific styling needs.

- Branding rules:

  - Primary: MVM Blue `#025fc7`.
  - Accent: MVM Yellow `#ba9309`.
  - Gradients:
    - Use linear gradient from Blue → Yellow for hero sections and primary CTAs.
  - UI style:
    - Professional, minimal, clear.
    - Layout:
      - Left sidebar navigation.
      - Top bar with product name, current user info and logout.
      - Main content area for tables/forms.

- Accessibility:
  - Ensure color contrast is sufficient.
  - Use semantic HTML elements.
  - Add ARIA attributes to menus, dialogs, forms, and complex interactive controls.

### 8.4 TypeScript & Naming Standards

- **General**

  - Strict TypeScript; no `any` (use `unknown` + proper guards).
  - Centralize shared types in `src/types/*`.
  - Prefer named `interface` / `type` aliases for props, payloads, etc.
  - All functions should have explicit return types.

- **Naming**

  - Components & types: `PascalCase`.
  - Variables & functions: `camelCase`.
  - Constants: `SCREAMING_SNAKE_CASE`.
  - Booleans: prefix with `is`, `has`, `should`, `can`.
  - Event handlers: prefix with `handle` or `on` (e.g., `handleSubmit`).

- **Files & folders**

  - React components: `PascalCase.tsx`.
  - Non-component files: `camelCase.ts`.
  - Page files: `page.tsx`, `layout.tsx`, `error.tsx`, `loading.tsx`.
  - Route folders: lowercase, hyphen-separated (e.g., `user-settings`, `[id]`).

- **Imports order**
  1. React imports.
  2. Next.js imports.
  3. Third-party libraries.
  4. Internal absolute imports `@/...`.
  5. Relative imports (local files).

### 8.5 Utilities & Patterns

- Use a `cn` helper combining `clsx` and `tailwind-merge` for className merging.
- Implement reusable helpers for:
  - Date formatting.
  - Slug generation.
  - Text truncation.
- Use Next `Image` for all images (including Supabase Storage URLs) and configure `next.config` remote patterns accordingly.

### 8.6 Error & Loading States

- For dynamic routes:
  - Implement `error.tsx` with client-side error boundaries.
  - Implement `loading.tsx` with skeletons/placeholders.

---

## 9. Non-Functional, Tooling & Workflow (Compact)

- **Performance**: target `< 2s` TTFB for admin pages; use dynamic imports for heavy client components, efficient image loading, and Next.js revalidation (`revalidate`, `revalidatePath`, `revalidateTag`) where appropriate.
- **DB & environments**: all schema changes go through migrations only; dev/staging/prod should share the same schema; run migrations and checks in CI before deploy.
- **Tooling**: use ESLint + Prettier (no `any`, no unused vars/params except `_`-prefixed, prefer `const`, Tailwind plugin, single quotes, no semicolons, print width ~100). Run lint, type-check, and build in CI.
- **Deployment**: deploy on Vercel (or similar) with required env vars set: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`. Use Node 18+.
- **Commits**: conventional commits like `feat(scope): ...`, `fix(scope): ...` are preferred; Husky/lint-staged may be used to enforce linting/formatting on commit.

---

## 10. How Future AI-Assisted Changes Should Behave

- Always follow this file’s tech stack, RBAC, security, and code-driven navigation rules.
- When adding features, update menu config + permissions and keep the single, immutable Super Admin invariant intact.
- Default to least-privilege, secure behavior (RLS, server-side mutations, no service keys in client) and align with the established naming, structure, and styling conventions.
- If requirements seem ambiguous, prefer a safer interpretation and ask for clarification in the prompt instead of weakening these rules.
