import { NextResponse, type NextRequest } from 'next/server'


const TOKEN_PATH = /^\/([^/]+)\/pay\/?$/
const LEGACY_CHECKOUT_PATH = /^\/checkout\/([^/]+)\/pay\/?$/

function getHostname(url: string | undefined): string | null {
  if (!url) return null
  try {
    return new URL(url).hostname.toLowerCase()
  } catch {
    return null
  }
}

export function middleware(request: NextRequest) {
  const checkoutHost = getHostname(process.env.NEXT_PUBLIC_CHECKOUT_URL)
  const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL

  if (!checkoutHost) {
    return NextResponse.next()
  }

  const requestHost = request.headers.get('host')?.split(':')[0]?.toLowerCase()
  if (requestHost !== checkoutHost) {
    return NextResponse.next()
  }

  const { pathname, search } = request.nextUrl

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/avatars') ||
    pathname.startsWith('/company-logos') ||
    pathname.startsWith('/team-icons') ||
    pathname.startsWith('/invoice-logos') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return NextResponse.next()
  }

  const shortMatch = pathname.match(TOKEN_PATH)
  if (shortMatch) {
    const url = request.nextUrl.clone()
    url.pathname = `/checkout/${shortMatch[1]}/pay`
    return NextResponse.rewrite(url)
  }

  // Legacy long form `/checkout/<token>/pay` → keep it working.
  if (LEGACY_CHECKOUT_PATH.test(pathname)) {
    return NextResponse.next()
  }

  // Anything else on the checkout host → bounce to the dashboard.
  if (frontendUrl) {
    try {
      const target = new URL(pathname + search, frontendUrl)
      return NextResponse.redirect(target, 308)
    } catch {
      // fall through
    }
  }
  return NextResponse.redirect(new URL('https://fakturapp.cc'), 308)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
