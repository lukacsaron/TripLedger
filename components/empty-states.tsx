/**
 * Empty State Components
 * Provide guidance when no data exists
 */

'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plane, Receipt, TrendingUp, Settings2 } from 'lucide-react'
import Link from 'next/link'

interface EmptyStateProps {
  title: string
  description: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  icon?: React.ReactNode
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <Card className="p-12 text-center">
      <div className="mx-auto w-fit mb-4 text-muted-foreground">
        {icon || <Receipt className="w-16 h-16" />}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">{description}</p>
      {action && (
        action.href ? (
          <Link href={action.href}>
            <Button size="lg">{action.label}</Button>
          </Link>
        ) : (
          <Button size="lg" onClick={action.onClick}>
            {action.label}
          </Button>
        )
      )}
    </Card>
  )
}

export function NoTripsState({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon={<Plane className="w-16 h-16" />}
      title="No Trips Yet"
      description="Create your first trip to start tracking expenses. Set your budget and exchange rates, then add expenses as you go."
      action={{
        label: "Create Your First Trip",
        onClick: onCreate,
        href: onCreate ? undefined : "/trips",
      }}
    />
  )
}

export function NoExpensesState() {
  return (
    <EmptyState
      icon={<Receipt className="w-16 h-16" />}
      title="No Expenses Yet"
      description="Start tracking your holiday expenses. Add them manually or scan receipts with AI."
      action={{
        label: "Add Your First Expense",
        href: "/expenses/new",
      }}
    />
  )
}

export function NoAnalyticsState() {
  return (
    <EmptyState
      icon={<TrendingUp className="w-16 h-16" />}
      title="Not Enough Data"
      description="Add some expenses to see analytics and spending patterns."
      action={{
        label: "Add Expenses",
        href: "/expenses/new",
      }}
    />
  )
}

export function NoBudgetState() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
      <div className="flex items-start gap-3">
        <Settings2 className="w-5 h-5 text-amber-600 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-amber-900 mb-1">No Budget Set</h4>
          <p className="text-sm text-amber-800 mb-3">
            Set a budget to track your spending progress and get alerts when approaching limits.
          </p>
          <Link href="/settings">
            <Button variant="outline" size="sm" className="border-amber-300 hover:bg-amber-100">
              Set Budget in Settings
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export function WelcomeScreen({ onCreateTrip }: { onCreateTrip: () => void }) {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-6">
      <div className="max-w-2xl text-center space-y-8">
        <div>
          <div className="text-6xl mb-4">✈️</div>
          <h1 className="text-4xl font-bold mb-4">Welcome to TripLedger</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Your minimalistic holiday expense tracker with fixed exchange rates
          </p>
        </div>

        <Card className="p-8 text-left">
          <h2 className="text-2xl font-semibold mb-4">How it works:</h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-bold">
                1
              </div>
              <div>
                <h3 className="font-medium mb-1">Create a Trip</h3>
                <p className="text-sm text-muted-foreground">
                  Set your destination, dates, budget, and lock in your exchange rates
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-bold">
                2
              </div>
              <div>
                <h3 className="font-medium mb-1">Track Expenses</h3>
                <p className="text-sm text-muted-foreground">
                  Add expenses manually or scan receipts with AI as you travel
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-bold">
                3
              </div>
              <div>
                <h3 className="font-medium mb-1">Analyze & Settle</h3>
                <p className="text-sm text-muted-foreground">
                  View spending breakdown and calculate who owes whom
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Button size="lg" className="text-lg h-14 px-8" onClick={onCreateTrip}>
          Create Your First Trip
        </Button>
      </div>
    </div>
  )
}
