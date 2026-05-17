import { NextResponse, type NextRequest } from 'next/server'

const AUTH_COOKIE = 'faktur_platform_authed'

const PUBLIC_PATHS = [
  '/login',
  '/oauth/callback',
]

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  const hasAuth = request.cookies.get(AUTH_COOKIE)?.value === '1'
  if (hasAuth) {
    return NextResponse.next()
  }

  const loginUrl = new URL('/login', request.url)
  if (pathname !== '/') {
    loginUrl.searchParams.set('next', `${pathname}${search}`)
  }
  return NextResponse.redirect(loginUrl)
}

export const config = {
  // Skip API routes, _next internals, and static assets.
  matcher: ['/((?!_next/|api/|favicon.ico|.*\\..*).*)'],
}
