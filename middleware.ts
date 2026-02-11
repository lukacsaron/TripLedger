import { NextRequest, NextResponse } from 'next/server'

/**
 * Simple authentication middleware.
 * Protects all /api/* routes (except /api/auth/*) by checking for a valid session cookie.
 * The session cookie is set by the /api/auth/login endpoint.
 */
export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Allow auth endpoints through (login/logout)
    if (pathname.startsWith('/api/auth')) {
        return NextResponse.next()
    }

    // Check for auth cookie on API routes
    if (pathname.startsWith('/api/')) {
        const authCookie = request.cookies.get('tripledger_auth')
        const appSecret = process.env.APP_SECRET

        if (!appSecret) {
            // If no APP_SECRET is set, allow all requests (dev convenience)
            return NextResponse.next()
        }

        if (!authCookie || authCookie.value !== appSecret) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }
    }

    // Redirect unauthenticated page requests to login
    if (!pathname.startsWith('/api/') && pathname !== '/login') {
        const authCookie = request.cookies.get('tripledger_auth')
        const appSecret = process.env.APP_SECRET

        if (appSecret && (!authCookie || authCookie.value !== appSecret)) {
            const loginUrl = new URL('/login', request.url)
            loginUrl.searchParams.set('redirect', pathname)
            return NextResponse.redirect(loginUrl)
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        // Match all API routes except _next and static files
        '/api/:path*',
        // Match pages (but not _next, static files, login, favicon, etc.)
        '/((?!_next/static|_next/image|favicon.ico|login).*)',
    ],
}
