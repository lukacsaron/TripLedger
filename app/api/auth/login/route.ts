import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/auth/login
 * Validates the password and sets a session cookie.
 */
export async function POST(request: NextRequest) {
    try {
        const { password } = await request.json()
        const appSecret = process.env.APP_SECRET

        if (!appSecret) {
            return NextResponse.json(
                { error: 'APP_SECRET not configured' },
                { status: 500 }
            )
        }

        if (password !== appSecret) {
            return NextResponse.json(
                { error: 'Invalid password' },
                { status: 401 }
            )
        }

        const response = NextResponse.json({ success: true })

        response.cookies.set('tripledger_auth', appSecret, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 30, // 30 days
        })

        return response
    } catch {
        return NextResponse.json(
            { error: 'Invalid request' },
            { status: 400 }
        )
    }
}
