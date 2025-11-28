# My Virtual Mate – Backend Panel PRD

| Field          | Value                                                  |
| -------------- | ------------------------------------------------------ |
| Product        | My Virtual Mate – Backend Panel                        |
| Document Owner | TBD                                                    |
| Stakeholders   | Founder, Backend Engineer, Frontend Engineer, Designer |
| Status         | Draft                                                  |
| Target Release | TBD                                                    |

---

## 1. Overview

My Virtual Mate – Backend Panel is an internal admin platform for managing application users, roles, and permissions, plus a minimal public “coming soon” website. The core requirement is a strict RBAC system with a single immutable Super Admin, code-driven navigation structure, and dynamic DB-driven permissions layered on top of Supabase Auth and Postgres.

The backend panel will be protected behind login (no self-service signup) and used only by authorized internal users who are invited by an existing admin through email flows powered by Resend.

---

## 2. Goals and Success Criteria

**Goals**

- Provide a secure and maintainable admin panel that can evolve as new features/sections are added without changing the database schema for navigation.
- Implement a robust RBAC system where permissions are dynamic and configurable from the UI while the menu/navigation tree remains in code for developer ergonomics and type safety.
- Guarantee a single, non-editable Super Admin user with full privileges that cannot be cloned, reassigned, or modified by any other user.

**Success criteria**

- Admins can log in, manage backend-panel users, and configure role permissions without database or code changes (except when adding new features/menu items).
- Only one Super Admin exists at any time, and attempts to modify or delete this user or role are blocked at both UI and database levels.
- New menu sections can be added by editing a TypeScript menu configuration file and wiring routes/components, with the permission system automatically accommodating the new permission keys.

---

## 3. Users and Roles

### 3.1 User Types

- **Super Admin (single instance)**

  - Has full access to all current and future features, regardless of configured role permissions.
  - Cannot be edited or deleted by any user, including themselves; email, name, and role are immutable from the UI and blocked at the DB layer.

- **Admin Panel User**
  - Internal user with a role assigned (e.g., Admin, Manager, Support) and a set of permissions controlled via the role-permission matrix.
  - Can log in and perform actions only if permitted by their role’s associated permissions.

### 3.2 User Data Model (Admin Panel Profile)

Minimum data for each admin user:

- `name` – full name.
- `email` – unique email, primary identifier for login.
- `avatar_url` – optional profile picture stored via Supabase Storage.
- `status` – enum: `active`, `inactive`, `deleted` (soft-delete).
- `role_id` – foreign key to `roles` table, except for the unique Super Admin constraint.

Auth identity (passwords, sessions) will be handled via Supabase Auth’s `auth.users` table, with a `profiles` table linking to it by `user_id`.

---

## 4. Functional Requirements

### 4.1 Main Public Website

- A minimal “Coming Soon” homepage at `/` with My Virtual Mate branding (logo placeholder, tagline, short description).
- Optionally, a basic email capture or contact form that sends submissions to a configured email or external CRM in later iterations (can be out of scope for v1).

Branding requirements:

- Primary color: MVM Blue `#025fc7`.
- Accent color: MVM Yellow `#ba9309`.
- Gradient: linear gradient using MVM Blue → MVM Yellow (e.g., for hero background or primary CTAs).

### 4.2 Authentication (Admin Panel)

- **Login only, no signup**

  - `/admin/login` screen with email and password fields.
  - No self-service signup UI; access is invitation-only.
  - “Forgot password” link triggers Supabase password reset flow, sending an email to the user’s registered address.

- **Sessions & security**

  - Use Supabase Auth session handling for the Next.js app router (server components / middleware) to protect `/admin/**` routes.
  - Idle timeout or short session duration for admin users (configurable), with refresh tokens managed by Supabase.

- **Access control**
  - Every admin route and server-side action must verify the authenticated user and their effective permissions (or Super Admin).

### 4.3 Navigation and Menu (Code-Defined)

- The menu and submenu structure for the backend panel must be defined in code as a typed configuration object, e.g., `MENU_CONFIG` in `config/menu.ts`.
- Each menu item must include at least: `id` (stable key), `label`, `path`, `icon` (optional), `children`, and an associated `permissionScope` or `featureKey`.
- The sidebar navigation and sub-navigation elements are rendered entirely from this configuration, with no menu table in the database.
- Adding a new section or feature involves:
  - Updating `MENU_CONFIG`.
  - Creating the corresponding route and page/component.
  - Adding associated permission keys in code (and synchronizing them to DB via seed/migration).

### 4.4 User Management (Admin Panel)

**List view**

- Paginated list of admin-panel users with columns: Name, Email, Role, Status, Last Login (if available), Created At.
- Filters: by role, status (active/inactive), and text search by name/email.

**Create / Invite user**

- Flow available only to users with the `users.invite` or equivalent permission (Super Admin always allowed).
- Steps:
  - Admin enters name, email, initial role, and status (default active).
  - System creates a Supabase Auth user and `profiles` row in a transactional way.
  - System triggers an invitation email via Resend with a secure link to set password or complete onboarding.

**Edit user**

- Fields editable: name, avatar URL (via upload picker), status, and role.
- Email may be immutable by default or only editable by users with a specific permission; changing email must update both Auth and `profiles`.
- It must not be possible to edit the Super Admin’s role, status, or email from the UI, and DB constraints must enforce this as well.

**Deactivate / Reactivate user**

- Inactivate an account to prevent login without losing historical audit data.
- Reactivation allowed only for users with the proper permission and not for the Super Admin.

**Delete user (soft delete)**

- Flag user as `deleted` and prevent login while retaining references in logs and foreign keys.
- Super Admin cannot be deleted under any circumstance.

### 4.5 Role and Permission Management

**Role model**

- `roles` table includes: `id`, `name`, `description`, system flags such as `is_super_admin` (boolean) and `is_system` (for protected roles).
- Exactly one role row has `is_super_admin = true`, with a DB-level check or uniqueness constraint.

**Permissions model**

- Permissions are defined in code as a flat or grouped set of `permission_key` strings (e.g., `users.view`, `users.edit`, `roles.manage`, `settings.view`).
- A `permissions` table stores each known key and metadata (group, label, description) so the UI can render human-readable labels.
- A `role_permissions` table associates `role_id` with one or more `permission_key` entries, optionally with flags like `can_view`, `can_create`, `can_update`, `can_delete` depending on design choice.

**Synchronization**

- On deployment or migration, the system syncs any missing `permission_key` values from code into the `permissions` table in an idempotent way.
- Outdated permission keys may be flagged for cleanup but not automatically deleted to avoid breaking existing roles.

**Role & permission UI**

- “Roles” screen: list roles with name, description, number of users, and last updated.
- Role detail screen:
  - Edit basic info (name, description) except for Super Admin (read-only).
  - Permission matrix:
    - Rows grouped by feature/module (e.g., Users, Roles, Settings).
    - Columns for each permission key or CRUD columns with checkboxes.
  - Ability to assign/unassign permissions for that role, except that Super Admin’s permissions are fixed as “all allowed” and not editable.

**Super Admin handling**

- Super Admin bypasses `role_permissions` checks and is treated as having every permission.
- UI should clearly indicate that this role and its single user are immutable.

### 4.6 Email Integration (Resend)

- Use Resend’s email API for all application-generated emails (invites, critical alerts, possibly login-related messages if configured).
- Email types v1:
  - Invitation email with secure onboarding link.
  - Optional: admin notifications (e.g., “New admin created”, “Role permissions changed”) to Super Admin.
- Email content requirements:
  - Must use My Virtual Mate branding and colors and be responsive on mobile.
  - Should not expose internal admin URLs directly without secure tokens.

All email sending must be encapsulated behind a server-side utility module (e.g., `lib/email.ts`) to simplify future provider changes.

### 4.7 Audit Logging and Security

- Audit log entries for:
  - User creation, updates, status changes, role changes.
  - Role creation, deletion, and permission modifications.
  - Login success/failure (at least for admin users).
- Each log entry includes actor user ID, action type, target type, target ID, timestamp, and metadata JSON.

Security requirements:

- Enable Row-Level Security (RLS) on all business tables and implement policies that restrict reads/writes based on user role and effective permissions, following Supabase RBAC patterns.
- All mutations must be performed via server-side code with permission checks; the frontend must never call PostgREST endpoints with raw keys for privileged operations.

---

## 5. Technical and Non-Functional Requirements

### 5.1 Tech Stack

- Frontend: Next.js (App Router) with TypeScript and React; Tailwind CSS or similar utility framework for rapid, consistent styling.
- Backend/DB: Supabase (Postgres, Auth, Storage, RLS), using SQL migrations for all schema changes.
- Email: Resend API for transactional emails.
- Hosting: Likely Vercel (or similar) for the Next.js app and Supabase for backend; exact infra can be decided later.

### 5.2 Performance and Reliability

- Admin panel load times should be acceptable on typical broadband connections; target <2 seconds TTFB for authenticated dashboard pages where feasible.
- Basic error handling and retry logic for critical operations (user creation, role changes, email sending).

### 5.3 Security and Compliance

- Environment variables must be used for Supabase keys and Resend API keys, with strict separation between anon/public and service roles.
- No direct exposure of service-level keys to the client; all privileged calls happen on the server.
- HTTPS required for all environments, especially production.

### 5.4 Migrations and Environments

- All DB changes must be applied via migration files (SQL or supported migration tooling), never manual edits.
- At least two environments: `dev` and `prod` (optionally `staging`), with identical schema and automated deployment pipelines.

---

## 6. UX, UI, and Branding

- Professional, minimal UI focusing on clarity and efficiency for internal users.
- Layout:
  - Left sidebar for navigation (menu and submenus).
  - Top bar with product name, current user info (name, avatar, role), and logout.
  - Content area for pages and tables.

Branding:

- Primary color: MVM Blue `#025fc7` for main highlights, links, primary buttons.
- Secondary/Accent: MVM Yellow `#ba9309` for accents, warning/action highlights, and gradient endpoints.
- Gradient usage: primary call-to-action buttons, header backgrounds, or hero areas should use a blue→yellow linear gradient that feels modern and subtle.

Accessibility:

- Ensure sufficient color contrast between text and backgrounds, especially when using the gradient.
- Use semantic HTML and ARIA attributes in critical interactive components (menus, dialogs, forms).

---
