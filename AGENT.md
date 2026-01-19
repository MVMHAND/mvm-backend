# MVM Admin App — AGENTS.md

These instructions apply to the Admin app repo (Next.js App Router + Supabase).

## Scope warning (shared FileSystem access)

- FileSystem MCP can access BOTH the admin repo and the website repo (`test-mvm-official`) in this environment. [file:72]
- Unless explicitly requested, do not read/modify `test-mvm-official`; focus only on the Admin app repo.

## Ground rules

- Prefer minimal, safe diffs over refactors.
- Before coding: locate the closest existing feature that matches the change (Users/Roles/Blog/Job Posts/Settings) and mirror its patterns.
- If unsure about permissions/security, choose the stricter option and ask for clarification.

## Architecture map (where things go)

- Routes/pages/layouts: `src/app/**`
  - Protected admin area: `src/app/admin/(protected)/**`
- Core security + authz: `src/lib/dal.ts`
- Supabase clients:
  - Server-side: `src/lib/supabase/server.ts` (includes service-role client helper; server-only)
  - Client-side: `src/lib/supabase/client.ts` (anon key only)
- Permission keys: `src/lib/permission-constants.ts`
- Menu + permission mapping: `src/config/menu.ts`
- Feature UI:
  - Feature components: `src/components/features/<feature>/**`
  - Shared reusable components: `src/components/shared/**`
- DB schema:
  - Supabase project + migrations: `supabase/**` and `supabase/migrations/**`

## Security model (defense in depth)

- Layer 1: `middleware.ts` protects `/admin/*` for UX (fast redirect).
- Layer 2: DAL is the primary enforcement for Server Components, Server Actions, and Route Handlers.
- Layer 3: RLS policies in Supabase migrations protect data even if app logic fails.

### Non-negotiables

- Use DAL for auth/authz in server code (Server Components/Actions/handlers).
- Use `supabase.auth.getUser()`-validated flows (via DAL); do not use `getSession()` for authorization decisions.
- Never use Supabase service role key in client/browser code.
- Do not bypass permissions by “just hiding UI”; enforce on the server.

## How to add a new admin feature (checklist)

1. Database

- Add migrations under `supabase/migrations/*`.
- Enable RLS and add policies for new tables.
- Add storage buckets/policies if the feature uploads files.

2. Permissions

- Add permission keys to `src/lib/permission-constants.ts`.
- Add/attach menu items and required permissions in `src/config/menu.ts`.
- Ensure server-side enforcement uses DAL permission checks.

3. UI + routes

- Add routes under `src/app/admin/(protected)/<feature>/**`.
- Prefer Server Component pages for fetching + gating; pass data to Client Components for interactivity.

4. Mutations

- Implement mutations as server-only code (Server Actions or route handlers).
- Return a consistent `{ success, data?, error? }` response shape.

5. Validate

- Use Playwright to confirm: login works and the new/edited route loads without console errors.
- Use supabase_dev to confirm schema names match what code/migrations expect.

## Coding standards (enforced)

- TypeScript strict: no `any` (use `unknown` + narrowing).
- Keep styling in Tailwind utilities; avoid introducing a second styling system.
- Avoid duplicating auth/permission logic in pages/components; centralize in DAL.
- Keep permission keys consistent and centralized; do not scatter string literals.

## “When editing X, also check Y”

- If editing permissions/menu: update `permission-constants.ts` + `menu.ts` + DAL checks + verify UI gating.
- If editing `/admin/*` routes: verify `middleware.ts` + protected layout/session verification.
- If changing DB schema: add migrations + RLS policies + update types + re-test related pages.

## Local dev info (dev-only convenience)

- Admin URL: http://localhost:3000/
- Login: superadmin@mvm.com / 12345678
