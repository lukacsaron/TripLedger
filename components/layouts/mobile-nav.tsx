/**
 * Mobile Navigation Component
 * Bottom navigation bar for mobile devices
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, PlusCircle, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AddExpenseModal } from '@/components/expenses/add-expense-modal'

export function MobileNav() {
  const pathname = usePathname()
  const [showAddModal, setShowAddModal] = useState(false)

  const links = [
    { href: '/dashboard', label: 'Home', icon: Home },
    { href: '/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-950 border-t border-border z-50">
        <div className="flex justify-around items-center h-16">
          {/* Home Link */}
          <Link
            href="/dashboard"
            className={cn(
              'flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors',
              pathname === '/dashboard'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Home className={cn('h-5 w-5', pathname === '/dashboard' && 'stroke-[2.5]')} />
            <span className={cn('text-xs', pathname === '/dashboard' && 'font-medium')}>
              Home
            </span>
          </Link>

          {/* Add Button (Opens Modal) */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors text-foreground"
          >
            <PlusCircle className="h-5 w-5 stroke-[2.5]" />
            <span className="text-xs font-medium">Add</span>
          </button>

          {/* Settings Link */}
          <Link
            href="/settings"
            className={cn(
              'flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors',
              (pathname === '/settings' || pathname.startsWith('/settings/'))
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Settings className={cn('h-5 w-5', (pathname === '/settings' || pathname.startsWith('/settings/')) && 'stroke-[2.5]')} />
            <span className={cn('text-xs', (pathname === '/settings' || pathname.startsWith('/settings/')) && 'font-medium')}>
              Settings
            </span>
          </Link>
        </div>
      </nav>

      {/* Add Expense Modal */}
      <AddExpenseModal open={showAddModal} onOpenChange={setShowAddModal} />
    </>
  )
}
