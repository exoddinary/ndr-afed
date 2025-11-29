import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  // Propagate pathname as a REQUEST header for server components
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-pathname', req.nextUrl.pathname)

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })

  // Always allow localhost access regardless of environment
  const host = req.nextUrl.hostname
  const isLocalhost = host === 'localhost' || host === '127.0.0.1' || host === '::1'
  if (isLocalhost) {
    return response
  }

  // Only apply password protection in production
  if (process.env.NODE_ENV !== 'production') {
    return response
  }

  const USER_ID = process.env.USER_ID
  const USER_PASSWORD = process.env.USER_PASSWORD

  const authHeader = req.headers.get('authorization')

  if (!authHeader) {
    return new NextResponse('Auth required', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' },
    })
  }

  const [scheme, encoded] = authHeader.split(' ')
  if (scheme !== 'Basic' || !encoded) {
    return new NextResponse('Invalid auth header', { status: 400 })
  }

  const decoded = Buffer.from(encoded, 'base64').toString()
  const [user, pass] = decoded.split(':')

  if (user === USER_ID && pass === USER_PASSWORD) {
    return response
  }

  return new NextResponse('Forbidden', { status: 403 })
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'], // protects all routes except API, static files, and favicon
}
