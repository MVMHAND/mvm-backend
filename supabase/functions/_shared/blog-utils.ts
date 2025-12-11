import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, origin',
}

/**
 * Creates a Supabase admin client with service role key
 * Used to bypass RLS for domain verification and blog post access
 */
export function createAdminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )
}

/**
 * Verify the requesting domain is allowed
 * If not allowed, auto-track the domain attempt
 * Uses service role client to bypass RLS for reading allowed domains
 */
export async function verifyDomain(origin: string | null): Promise<boolean> {
  if (!origin) return false
  
  try {
    const supabaseAdmin = createAdminClient()

    // Check if the origin domain is in the allowed list
    const { data, error } = await supabaseAdmin
      .from('public_allowed_domains')
      .select('domain, is_active')
      .eq('is_active', true)
    
    if (error) {
      console.error('Error fetching allowed domains:', error)
      return false
    }
    
    // Check if origin matches any allowed domain
    const isAllowed = data.some((entry: any) => {
      const allowedDomain = entry.domain.toLowerCase()
      const requestOrigin = origin.toLowerCase()
      return requestOrigin === allowedDomain || requestOrigin.startsWith(allowedDomain)
    })
    
    // If not allowed, track this domain attempt
    if (!isAllowed) {
      await trackUnauthorizedDomain(origin)
    }
    
    return isAllowed
  } catch (err) {
    console.error('Domain verification error:', err)
    return false
  }
}

/**
 * Track unauthorized domain access attempts
 * Creates inactive domain entry with description noting it was auto-tracked
 * Uses service role client to bypass RLS
 */
export async function trackUnauthorizedDomain(origin: string): Promise<void> {
  try {
    const supabaseAdmin = createAdminClient()

    // Check if this domain is already tracked
    const { data: existing } = await supabaseAdmin
      .from('public_allowed_domains')
      .select('id')
      .eq('domain', origin)
      .single()
    
    // Only add if not already in the database
    if (!existing) {
      const { error } = await supabaseAdmin
        .from('public_allowed_domains')
        .insert({
          domain: origin,
          description: `Auto-tracked: Attempted to access blog API on ${new Date().toISOString()}`,
          is_active: false,
        })
      
      if (error) {
        console.error('Error inserting unauthorized domain:', error)
      } else {
        console.log(`Tracked unauthorized domain attempt: ${origin}`)
      }
    }
  } catch (err) {
    // Don't fail the request if tracking fails
    console.error('Error tracking unauthorized domain:', err)
  }
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  error: string,
  status: number,
  code?: string
): Response {
  return new Response(
    JSON.stringify({ 
      error,
      ...(code && { code })
    }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}

/**
 * Creates a standardized success response
 */
export function createSuccessResponse(data: any): Response {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

/**
 * Handles CORS preflight requests
 */
export function handleCorsPreFlight(): Response {
  return new Response('ok', { headers: corsHeaders })
}
