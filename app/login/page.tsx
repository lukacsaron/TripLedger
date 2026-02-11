'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock } from 'lucide-react'

function LoginForm() {
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const searchParams = useSearchParams()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            })

            if (res.ok) {
                const redirect = searchParams.get('redirect') || '/'
                router.push(redirect)
                router.refresh()
            } else {
                setError('Invalid password')
            }
        } catch {
            setError('Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-full max-w-sm space-y-6">
            <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Lock className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">TripLedger</h1>
                <p className="text-sm text-muted-foreground">Enter your password to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        autoFocus
                        required
                    />
                </div>

                {error && (
                    <p className="text-sm text-destructive">{error}</p>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Signing in...' : 'Sign in'}
                </Button>
            </form>
        </div>
    )
}

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Suspense fallback={
                <div className="w-full max-w-sm space-y-6 animate-pulse">
                    <div className="text-center space-y-2">
                        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10" />
                        <div className="h-8 bg-muted rounded w-40 mx-auto" />
                        <div className="h-4 bg-muted rounded w-56 mx-auto" />
                    </div>
                </div>
            }>
                <LoginForm />
            </Suspense>
        </div>
    )
}
