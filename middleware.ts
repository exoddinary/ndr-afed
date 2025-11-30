import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  // Propagate pathname as a REQUEST header for server components
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-pathname', req.nextUrl.pathname)

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })
  // No Basic Auth here; app-level authentication is handled by the login page
  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'], // protects all routes except API, static files, and favicon
}
