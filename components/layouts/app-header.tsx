'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { TripSelector } from '@/components/trips/trip-selector'
import { cn } from '@/lib/utils'

export function AppHeader() {
  const pathname = usePathname()

  const links = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/expenses/new', label: 'Add Expense' },
    { href: '/analytics', label: 'Analytics' },
    { href: '/settings', label: 'Settings' },
  ]

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-6 md:gap-8">
          {/* Logo/Branding */}
          <Link href="/trips" className="flex items-center space-x-2">
            <div className="text-2xl font-bold tracking-tight">TripLedger</div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex bg-background items-center gap-6 text-sm font-medium">
            {links.map(({ href, label }) => {
              const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "transition-colors hover:text-foreground/80",
                    isActive ? "text-foreground" : "text-foreground/60"
                  )}
                >
                  {label}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Desktop: Trip Selector */}
        <div className="hidden md:block">
          <TripSelector />
        </div>

        {/* Mobile: Simple branding or menu */}
        <div className="md:hidden">
          <Link
            href="/trips"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Trips
          </Link>
        </div>
      </div>
    </header>
  )
}
