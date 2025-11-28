import { createServerClient } from '@supabase/ssr'
import { createClient as createServiceRoleClient, type SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

/**
 * Creates a Supabase client for Server Components and Server Actions
 * Uses the anon key for regular user operations
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Silently fail - cookies can only be modified in Server Actions or Route Handlers
            // This is expected when checking auth in Server Components
          }
        },
      },
    }
  )
}

/**
 * Creates a Supabase admin client with service role privileges
 * Use this ONLY for admin operations like inviting users, bypassing RLS, etc.
 * NEVER expose this client to the browser
 */
let adminClient: SupabaseClient | null = null

export async function createAdminClient() {
  if (!adminClient) {
    adminClient = createServiceRoleClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    )
  }

  return adminClient
}
