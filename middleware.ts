import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  try {
    const { supabase, response } = createClient(request)

    // Get the current session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Protect /admin routes (except /admin/login)
    if (request.nextUrl.pathname.startsWith('/admin') && 
        !request.nextUrl.pathname.startsWith('/admin/login')) {
      if (!session) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/admin/login'
        return NextResponse.redirect(redirectUrl)
      }
    }

    // Redirect to dashboard if already logged in and trying to access login
    if (request.nextUrl.pathname === '/admin/login' && session) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/admin'
      return NextResponse.redirect(redirectUrl)
    }

    return response
  } catch (error) {
    console.error('Middleware error:', error)
    // If there's an error, just continue without auth checks
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/admin/:path*',
  ],
}
