import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/admin'

  if (token_hash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type: type as 'signup' | 'invite' | 'magiclink' | 'recovery' | 'email_change',
      token_hash,
    })

    if (!error) {
      // If it's an invite, redirect to password setup
      if (type === 'invite') {
        return NextResponse.redirect(`${origin}/auth/setup-password`)
      }

      // Otherwise redirect to the specified next URL or admin dashboard
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to an error page with some instructions
  return NextResponse.redirect(`${origin}/auth/error`)
}
