# DAL Migration Guide

## Overview

This guide helps you migrate existing code to use the new **Data Access Layer (DAL)** for authentication and authorization.

The DAL provides:

- ✅ **Better security** - Always validates JWTs with Auth server
- ✅ **Performance** - React `cache()` prevents duplicate requests
- ✅ **Type safety** - Full TypeScript support with proper types
- ✅ **Cleaner code** - Centralized auth logic, less boilerplate

---

## Quick Reference

### Before vs After

#### Server Components (Pages)

**❌ Before:**

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function UsersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*, role:user_roles(*)')
    .eq('id', user.id)
    .single()

  // ... rest of code
}
```

**✅ After:**

```typescript
import { verifySessionWithProfile } from '@/lib/dal'

export default async function UsersPage() {
  const profile = await verifySessionWithProfile()

  // profile is guaranteed to exist and includes role info
  // ... rest of code
}
```

---

#### Server Actions

**❌ Before:**

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'

export async function deleteUser(userId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Check permission manually
  const { data: profile } = await supabase
    .from('users')
    .select('role:user_roles(is_super_admin)')
    .eq('id', user.id)
    .single()

  if (!profile?.role?.is_super_admin) {
    // Check specific permission...
    return { success: false, error: 'Unauthorized' }
  }

  // Proceed with deletion
}
```

**✅ After:**

```typescript
'use server'

import { verifySession, requirePermission } from '@/lib/dal'

export async function deleteUser(userId: string) {
  await verifySession()
  await requirePermission('users.delete')

  // Proceed with deletion - auth and authz handled
}
```

---

#### Permission Checks

**❌ Before:**

```typescript
import { hasPermission } from '@/lib/permissions'

export async function someAction() {
  const canEdit = await hasPermission('users.edit')
  if (!canEdit) {
    return { error: 'Unauthorized' }
  }
}
```

**✅ After:**

```typescript
import { hasPermission } from '@/lib/dal'

export async function someAction() {
  const canEdit = await hasPermission('users.edit')
  if (!canEdit) {
    return { error: 'Unauthorized' }
  }
}
```

---

## DAL Functions Reference

### Authentication Functions

#### `verifySession()`

Validates JWT and returns authenticated user. Redirects to login if not authenticated.

```typescript
import { verifySession } from '@/lib/dal'

export default async function ProtectedPage() {
  const user = await verifySession()
  // user is guaranteed to exist (Supabase User object)
}
```

#### `getCurrentUser()`

Returns user if authenticated, `null` otherwise. Does NOT redirect.

```typescript
import { getCurrentUser } from '@/lib/dal'

export default async function OptionalAuthPage() {
  const user = await getCurrentUser()

  if (!user) {
    return <div>Please log in</div>
  }

  return <div>Welcome {user.email}</div>
}
```

#### `getUserProfile()`

Returns full user profile with role information. Returns `null` if not authenticated.

```typescript
import { getUserProfile } from '@/lib/dal'

export default async function ProfilePage() {
  const profile = await getUserProfile()

  if (!profile) {
    return <div>Not logged in</div>
  }

  return (
    <div>
      <p>Name: {profile.name}</p>
      <p>Role: {profile.role.name}</p>
      <p>Super Admin: {profile.role.is_super_admin ? 'Yes' : 'No'}</p>
    </div>
  )
}
```

#### `verifySessionWithProfile()`

Validates JWT and returns full profile. Redirects to login if not authenticated.

```typescript
import { verifySessionWithProfile } from '@/lib/dal'

export default async function DashboardPage() {
  const profile = await verifySessionWithProfile()
  // profile is guaranteed to exist with full role info

  return <Dashboard user={profile} />
}
```

---

### Authorization Functions

#### `hasPermission(permissionKey)`

Checks if current user has a specific permission.

```typescript
import { hasPermission } from '@/lib/dal'

export async function editUser(userId: string) {
  'use server'

  const canEdit = await hasPermission('users.edit')

  if (!canEdit) {
    return { success: false, error: 'Unauthorized' }
  }

  // Proceed with edit
}
```

#### `requirePermission(permissionKey)`

Throws error if user doesn't have permission. Cleaner for Server Actions.

```typescript
import { verifySession, requirePermission } from '@/lib/dal'

export async function deleteUser(userId: string) {
  'use server'

  await verifySession()
  await requirePermission('users.delete')

  // Proceed - will throw if unauthorized
}
```

#### `getUserPermissions()`

Returns array of all permission keys for current user.

```typescript
import { getUserPermissions } from '@/lib/dal'

export default async function PermissionsPage() {
  const permissions = await getUserPermissions()

  return (
    <ul>
      {permissions.map(p => <li key={p}>{p}</li>)}
    </ul>
  )
}
```

#### `isSuperAdmin()`

Checks if current user is Super Admin.

```typescript
import { isSuperAdmin } from '@/lib/dal'

export default async function AdminOnlyPage() {
  const isAdmin = await isSuperAdmin()

  if (!isAdmin) {
    return <div>Access denied</div>
  }

  return <SuperAdminDashboard />
}
```

---

## Migration Patterns

### Pattern 1: Simple Protected Page

**Before:**

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  return <Content />
}
```

**After:**

```typescript
import { verifySession } from '@/lib/dal'

export default async function Page() {
  await verifySession()

  return <Content />
}
```

---

### Pattern 2: Page with User Profile

**Before:**

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*, role:user_roles(*)')
    .eq('id', user.id)
    .single()

  return <Content user={profile} />
}
```

**After:**

```typescript
import { verifySessionWithProfile } from '@/lib/dal'

export default async function Page() {
  const profile = await verifySessionWithProfile()

  return <Content user={profile} />
}
```

---

### Pattern 3: Server Action with Permission Check

**Before:**

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'

export async function createUser(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Manual permission check
  const { data: profile } = await supabase
    .from('users')
    .select('role_id')
    .eq('id', user.id)
    .single()

  const { data: permission } = await supabase
    .from('user_role_permissions')
    .select('*')
    .eq('role_id', profile.role_id)
    .eq('permission_key', 'users.create')
    .single()

  if (!permission) {
    return { success: false, error: 'Unauthorized' }
  }

  // Proceed with creation
}
```

**After:**

```typescript
'use server'

import { verifySession, requirePermission } from '@/lib/dal'

export async function createUser(formData: FormData) {
  await verifySession()
  await requirePermission('users.create')

  // Proceed with creation
}
```

---

### Pattern 4: Conditional Rendering Based on Permissions

**Before:**

```typescript
import { createClient } from '@/lib/supabase/server'
import { hasPermission } from '@/lib/permissions'

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  const canCreate = await hasPermission('users.create')
  const canDelete = await hasPermission('users.delete')

  return (
    <div>
      {canCreate && <CreateButton />}
      {canDelete && <DeleteButton />}
    </div>
  )
}
```

**After:**

```typescript
import { verifySession, hasPermission } from '@/lib/dal'

export default async function Page() {
  await verifySession()

  const canCreate = await hasPermission('users.create')
  const canDelete = await hasPermission('users.delete')

  return (
    <div>
      {canCreate && <CreateButton />}
      {canDelete && <DeleteButton />}
    </div>
  )
}
```

---

## Common Mistakes to Avoid

### ❌ Don't: Call DAL functions in Client Components

```typescript
'use client'

import { verifySession } from '@/lib/dal' // ERROR!

export default function ClientComponent() {
  // This will fail - DAL is server-only
  const user = await verifySession()
}
```

### ✅ Do: Pass data from Server Components to Client Components

```typescript
// app/page.tsx (Server Component)
import { verifySessionWithProfile } from '@/lib/dal'
import { ClientComponent } from './ClientComponent'

export default async function Page() {
  const profile = await verifySessionWithProfile()

  return <ClientComponent user={profile} />
}

// ClientComponent.tsx
'use client'

export function ClientComponent({ user }) {
  return <div>Welcome {user.name}</div>
}
```

---

### ❌ Don't: Use `getSession()` for auth checks

```typescript
// INSECURE - cookies can be spoofed
const {
  data: { session },
} = await supabase.auth.getSession()
if (session) {
  // This is not secure!
}
```

### ✅ Do: Use DAL functions that call `getUser()`

```typescript
// SECURE - validates JWT with Auth server
const user = await verifySession()
// or
const profile = await verifySessionWithProfile()
```

---

### ❌ Don't: Duplicate auth checks

```typescript
export default async function Page() {
  const user = await verifySession()
  const profile = await getUserProfile() // Duplicate request!
  const permissions = await getUserPermissions() // Another duplicate!
}
```

### ✅ Do: Use the most specific function you need

```typescript
export default async function Page() {
  // Single request gets everything
  const profile = await verifySessionWithProfile()
  const permissions = await getUserPermissions() // Uses cached user
}
```

---

## Performance Notes

All DAL functions use React's `cache()` API:

- Multiple calls to the same function in the same render pass = **1 database request**
- Example:
  ```typescript
  const user1 = await verifySession()
  const user2 = await verifySession() // No additional request
  const profile = await getUserProfile() // Uses cached user from above
  ```

This makes it safe to call DAL functions multiple times without performance concerns.

---

## TypeScript Types

### UserProfile

```typescript
interface UserProfile {
  id: string
  name: string
  email: string
  avatar_url: string | null
  status: string
  role_id: string
  role: {
    id: string
    name: string
    is_super_admin: boolean
    is_system: boolean
  }
  created_at: string
  updated_at: string
  last_login: string | null
}
```

Import it:

```typescript
import type { UserProfile } from '@/lib/dal'
```

---

## Checklist for Migration

When migrating a file:

- [ ] Replace `createClient()` + `getUser()` with DAL functions
- [ ] Replace manual permission checks with `hasPermission()` or `requirePermission()`
- [ ] Replace manual profile fetching with `getUserProfile()` or `verifySessionWithProfile()`
- [ ] Remove manual redirect logic (DAL handles it)
- [ ] Update imports to use `@/lib/dal`
- [ ] Remove unused imports (`@/lib/supabase/server`, `@/lib/permissions`)
- [ ] Test the functionality still works
- [ ] Verify error handling is appropriate

---

## Need Help?

If you're unsure about migrating a specific pattern:

1. Check this guide for similar examples
2. Look at `src/app/admin/(protected)/layout.tsx` for a real example
3. Read `SECURITY_IMPLEMENTATION.md` for security principles
4. When in doubt, use `verifySessionWithProfile()` - it's the safest option

---

## Summary

**Key Takeaways:**

1. **Always use DAL functions** for auth/authz in Server Components and Server Actions
2. **Never use `getSession()`** for security checks - always use `getUser()` (which DAL does)
3. **Performance is optimized** - React cache prevents duplicate requests
4. **Type safety is built-in** - full TypeScript support
5. **Cleaner code** - less boilerplate, centralized logic

The DAL is your **single source of truth** for authentication and authorization.
