import { NextResponse } from 'next/server'

/**
 * POST /api/auth/logout
 * Clears the session cookie.
 */
export async function POST() {
    const response = NextResponse.json({ success: true })

    response.cookies.set('tripledger_auth', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
    })

    return response
}
