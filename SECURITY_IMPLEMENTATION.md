# Security Implementation Guide

## Overview

This document explains the **professional, industry-standard authentication and authorization** implementation for the MVM Backend Panel, following **Next.js 15** and **Supabase** best practices as of December 2024.

## Architecture: Defense in Depth

We implement a **multi-layered security approach**:

1. **Middleware** - Optimistic auth checks (UX layer)
2. **Data Access Layer (DAL)** - Server-side verification (Security layer)
3. **Row Level Security (RLS)** - Database-level protection (Data layer)

---

## Layer 1: Middleware (Optimistic Checks)

**File:** `middleware.ts`

### Purpose
- **Fast redirects** for better UX
- **Runs on every request** to protected routes
- **NOT the primary security layer** (can be bypassed)

### Implementation

```typescript
export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request)

  // SECURITY: Always use getUser() - never trust cookies alone
  const { data: { user }, error } = await supabase.auth.getUser()
  const isAuthenticated = !error && !!user

  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect('/admin/login')
  }

  return response
}
```

### Why `getUser()` Instead of Cookies?

❌ **NEVER DO THIS:**
```typescript
// INSECURE: Cookies can be spoofed by anyone
const token = request.cookies.get('sb-access-token')?.value
const isAuth = Boolean(token)
```

✅ **ALWAYS DO THIS:**
```typescript
// SECURE: Validates JWT with Auth server
const { data: { user } } = await supabase.auth.getUser()
const isAuth = !!user
```

### Key Security Principles

1. **Never trust `getSession()`** in server-side code
   - `getSession()` reads directly from cookies (can be spoofed)
   - `getUser()` validates JWT signature with Auth server

2. **Middleware is NOT sufficient** for security
   - It's an optimization for UX (fast redirects)
   - Real security happens in the DAL

3. **Official Supabase Warning:**
   > "Always use `supabase.auth.getUser()` to protect pages and user data. Never trust `supabase.auth.getSession()` inside server code."

---

## Layer 2: Data Access Layer (DAL)

**File:** `src/lib/dal.ts`

### Purpose
- **Primary security layer** for Server Components, Server Actions, and Route Handlers
- **Centralized auth verification** with React's `cache()` for performance
- **Permission checks** integrated with RBAC system

### Core Functions

#### 1. `verifySession()` - Required Authentication

Use this when a route **requires** authentication:

```typescript
import { verifySession } from '@/lib/dal'

export default async function DashboardPage() {
  const user = await verifySession() // Redirects if not authenticated
  
  // User is guaranteed to exist here
  return <div>Welcome {user.email}</div>
}
```

**What it does:**
- Calls `supabase.auth.getUser()` to validate JWT
- Redirects to `/admin/login` if invalid/expired
- Returns user object if valid
- **Memoized** with `cache()` - multiple calls in same render = 1 request

#### 2. `getCurrentUser()` - Optional Authentication

Use this when authentication is **optional**:

```typescript
import { getCurrentUser } from '@/lib/dal'

export default async function ProfilePage() {
  const user = await getCurrentUser() // Returns null if not authenticated
  
  if (!user) {
    return <div>Please log in to view your profile</div>
  }
  
  return <div>Welcome {user.email}</div>
}
```

#### 3. `hasPermission()` - Authorization Check

Use this to check **specific permissions**:

```typescript
import { verifySession, hasPermission } from '@/lib/dal'

export async function deleteUser(userId: string) {
  'use server'
  
  const user = await verifySession()
  const canDelete = await hasPermission('users.delete')
  
  if (!canDelete) {
    throw new Error('Unauthorized: Missing users.delete permission')
  }
  
  // Proceed with deletion
}
```

### Usage Patterns

#### Server Components

```typescript
// app/admin/users/page.tsx
import { verifySession } from '@/lib/dal'

export default async function UsersPage() {
  const user = await verifySession()
  
  // Fetch data securely
  const users = await getUsers() // This should also verify permissions
  
  return <UsersList users={users} />
}
```

#### Server Actions

```typescript
// src/actions/users.ts
'use server'

import { verifySession, hasPermission } from '@/lib/dal'

export async function createUser(formData: FormData) {
  // 1. Verify authentication
  const user = await verifySession()
  
  // 2. Verify authorization
  const canCreate = await hasPermission('users.create')
  if (!canCreate) {
    return { error: 'Unauthorized' }
  }
  
  // 3. Proceed with action
  // ...
}
```

#### Route Handlers

```typescript
// app/api/users/route.ts
import { verifySession } from '@/lib/dal'
import { NextResponse } from 'next/server'

export async function GET() {
  const user = await verifySession()
  
  // Fetch and return data
  return NextResponse.json({ users: [] })
}
```

---

## Layer 3: Row Level Security (RLS)

**Location:** Supabase Database Policies

### Purpose
- **Last line of defense** at the database level
- Protects data even if application code is bypassed
- Enforces permissions at the row level

### Implementation

RLS policies are defined in migration files:

```sql
-- Example: Only allow users to see their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Example: Only Super Admin can delete users
CREATE POLICY "Only Super Admin can delete"
  ON profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.user_id = auth.uid()
      AND r.is_super_admin = true
    )
  );
```

---

## Why This Approach is Professional

### 1. **Follows Official Best Practices**

- ✅ Next.js 15 Authentication Guide
- ✅ Supabase Server-Side Auth Documentation
- ✅ React Server Components patterns

### 2. **Defense in Depth**

Multiple security layers ensure that if one layer fails, others protect the system:

```
Request → Middleware (UX) → DAL (Security) → RLS (Data) → Database
```

### 3. **Performance Optimized**

- Middleware provides fast redirects
- `cache()` prevents duplicate auth checks in same render
- RLS runs at database level (highly optimized)

### 4. **Type-Safe**

- Full TypeScript support
- Compile-time checks for permissions
- IDE autocomplete for permission keys

### 5. **Maintainable**

- Centralized auth logic in DAL
- Easy to audit and update
- Clear separation of concerns

---

## Migration from Old Approach

### Before (Insecure)

```typescript
// ❌ INSECURE: Trusting cookies
const token = request.cookies.get('sb-access-token')?.value
if (token) {
  // User is "authenticated"
}
```

### After (Secure)

```typescript
// ✅ SECURE: Validating with Auth server
const { data: { user } } = await supabase.auth.getUser()
if (user) {
  // User is authenticated
}
```

---

## Common Patterns

### Pattern 1: Protected Page

```typescript
// app/admin/dashboard/page.tsx
import { verifySession } from '@/lib/dal'

export default async function DashboardPage() {
  const user = await verifySession()
  return <Dashboard user={user} />
}
```

### Pattern 2: Conditional Rendering

```typescript
// app/admin/users/page.tsx
import { verifySession, hasPermission } from '@/lib/dal'

export default async function UsersPage() {
  const user = await verifySession()
  const canCreate = await hasPermission('users.create')
  
  return (
    <div>
      <UsersList />
      {canCreate && <CreateUserButton />}
    </div>
  )
}
```

### Pattern 3: API Route Protection

```typescript
// app/api/admin/users/route.ts
import { verifySession, hasPermission } from '@/lib/dal'

export async function POST(request: Request) {
  const user = await verifySession()
  const canCreate = await hasPermission('users.create')
  
  if (!canCreate) {
    return new Response('Forbidden', { status: 403 })
  }
  
  // Process request
}
```

---

## Security Checklist

When implementing a new feature, ensure:

- [ ] Middleware redirects unauthenticated users
- [ ] Server Component calls `verifySession()` or `getCurrentUser()`
- [ ] Server Actions verify both authentication and authorization
- [ ] Route Handlers check permissions before processing
- [ ] RLS policies are in place for all tables
- [ ] No sensitive data exposed to client
- [ ] No service-role keys in client code
- [ ] Audit logs capture all mutations

---

## References

- [Next.js 15 Authentication Guide](https://nextjs.org/docs/app/guides/authentication)
- [Supabase Server-Side Auth](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Supabase getUser() vs getSession()](https://supabase.com/docs/reference/javascript/auth-getsession)
- [React cache() API](https://react.dev/reference/react/cache)

---

## Questions?

If you're unsure about implementing auth for a specific use case:

1. Start with `verifySession()` in your Server Component
2. Add `hasPermission()` checks for specific actions
3. Ensure RLS policies match your application logic
4. Test with different user roles

**Remember:** When in doubt, be more restrictive. It's easier to grant access later than to fix a security breach.
