---
trigger: always_on
---

# MVM Admin (Next.js + Supabase) — Always On

Enforce security + structure conventions for the admin panel (DAL, RBAC, Server Components/Actions, Supabase). Keep short due to Windsurf rule limits.

### Local admin login (dev only)

- URL: http://localhost:3000/
- Email: superadmin@mvm.com
- Password: 12345678

## Important environment note

- In this Windsurf window, FileSystem MCP can also access the main website repo folder `test-mvm-official` (shared allowed directories). [file:72]
- This rules file applies ONLY to the Admin app codebase; avoid editing the website repo unless explicitly requested.

## Core stack (do not drift)

- Next.js App Router under `src/app/`.
- TypeScript strict mode, Tailwind CSS.
- Supabase for Auth + Postgres + Storage with RLS enabled.

## Security (non-negotiable)

- Server-side auth must validate via `supabase.auth.getUser()` or DAL wrappers that call it.
- Never treat cookie presence or `getSession()` as secure authentication in server code.
- `/admin/*` must remain protected (middleware is UX; DAL is primary enforcement; RLS is last line).
- Never expose Supabase service role key to client/browser code.
- All privileged mutations must be server-only (Server Actions / Route Handlers) and must enforce permissions.

## RBAC + navigation source of truth

- Menu is code-defined in `src/config/menu.ts` and permission keys are centralized in `src/lib/permission-constants.ts`.
- Do not hardcode permission strings in random components; import from permission constants.
- Super Admin is single + immutable; do not add new bypass paths.

## Server vs Client components

- Default to Server Components for pages/layouts (data loading + authz gating).
- Use Client Components only for interactivity; keep them UI-only and avoid direct DB/auth logic.

## Supabase + schema changes

- All DB changes must be migrations under `supabase/migrations/*`.
- New tables must include: RLS enabled + policies (and storage policies if applicable).
- After schema changes: update DB-aligned TS types in `src/types/*` and re-test affected routes.

## Response shape conventions

- Server Actions should return a consistent `{ success: boolean, data?: T, error?: string }` shape.

## MCP usage (available in this window)

- FileSystem MCP: read existing patterns before creating files; never invent paths.
- Playwright MCP: validate login + at least the route you changed.
- supabase_dev MCP: confirm schema/table/column/policy names before writing queries or migrations.

## Change-impact checklist

- If editing permissions/menu: update `permission-constants.ts` + `menu.ts` + DAL checks + verify UI gating.
- If editing `/admin/*` routes: verify `middleware.ts` + protected layout/session verification.
- If changing DB schema: add migrations + RLS policies + update types + re-test related pages.
