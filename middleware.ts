import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  try {
    const { supabase, response } = createClient(request)

    // SECURITY: Always validate session with getUser() - never trust cookies alone
    // This makes a server-side request to verify the JWT signature and expiration
    // Cookies can be spoofed, but getUser() validates against the Auth server
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    const isAuthenticated = !error && !!user

    // Define public auth routes
    const isAuthRoute =
      request.nextUrl.pathname === '/admin/login' ||
      request.nextUrl.pathname === '/admin/forgot-password'

    // Protect ALL /admin routes (except auth routes)
    // This includes valid routes and 404s - unauthenticated users should never see admin 404s
    const isProtectedRoute = request.nextUrl.pathname.startsWith('/admin') && !isAuthRoute

    if (isProtectedRoute && !isAuthenticated) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/admin/login'
      redirectUrl.searchParams.set('message', 'Please log in to access this page')
      // Only set redirect for potentially valid routes (not obvious 404s)
      if (
        !request.nextUrl.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)
      ) {
        redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
      }
      return NextResponse.redirect(redirectUrl)
    }

    // Redirect to dashboard if already logged in and trying to access login
    if (request.nextUrl.pathname === '/admin/login' && isAuthenticated) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/admin'
      return NextResponse.redirect(redirectUrl)
    }

    return response
  } catch (error) {
    console.error('Middleware error:', error)
    // On error, redirect to login for all admin routes except auth pages
    const isAuthRoute =
      request.nextUrl.pathname === '/admin/login' ||
      request.nextUrl.pathname === '/admin/forgot-password'

    if (request.nextUrl.pathname.startsWith('/admin') && !isAuthRoute) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/admin/login'
      redirectUrl.searchParams.set('message', 'Session expired. Please log in again.')
      return NextResponse.redirect(redirectUrl)
    }
    return NextResponse.next()
  }
}

export const config = {
  matcher: ['/admin/:path*'],
}
