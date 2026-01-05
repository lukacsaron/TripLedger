/**
 * Dashboard Page
 * Main view showing trip stats and recent expenses
 */

'use client'

import { useCurrentTrip } from '@/lib/hooks/use-current-trip'
import { useTrip, useTrips } from '@/lib/hooks/use-trips'
import { TripSelector } from '@/components/trips/trip-selector'
import { TripStats } from '@/components/trips/trip-stats'
import { ExpenseList } from '@/components/expenses/expense-list'
import { NoTripsState, NoExpensesState, WelcomeScreen } from '@/components/empty-states'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Camera, Upload } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const { data: allTrips, isLoading: tripsLoading } = useTrips()
  const { currentTripId, isLoading: tripLoading } = useCurrentTrip()
  const { data: trip, isLoading: tripDataLoading } = useTrip(currentTripId)

  // First time user - no trips at all
  if (!tripsLoading && (!allTrips || allTrips.length === 0)) {
    return <WelcomeScreen onCreateTrip={() => router.push('/trips')} />
  }

  // Loading state
  if (tripLoading || tripsLoading || !currentTripId) {
    return (
      <div className="container max-w-4xl mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (tripDataLoading) {
    return (
      <div className="container max-w-4xl mx-auto p-6 space-y-6">
        <TripSelector />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const recentExpenses = trip?.expenses || []
  const hasExpenses = trip && trip.expenses && trip.expenses.length > 0

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push('/expenses/scan')}
            className="hidden md:flex"
          >
            <Camera className="w-4 h-4 mr-2" />
            Scan Receipt
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/expenses/import')}
            className="hidden md:flex"
          >
            <Upload className="w-4 h-4 mr-2" />
            Mass Import
          </Button>
          <Button onClick={() => router.push('/expenses/new')}>
            + Add Expense
          </Button>
        </div>
      </div>

      {/* Trip Stats */}
      {hasExpenses && <TripStats tripId={currentTripId} />}

      {/* Expenses Section */}
      <div className="space-y-4">
        {hasExpenses ? (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Recent Expenses</h2>
            </div>
            <ExpenseList expenses={recentExpenses} />
          </>
        ) : (
          <NoExpensesState />
        )}
      </div>

      {/* Quick Actions - Mobile FAB Style */}
      <div className="fixed bottom-20 right-6 md:hidden flex flex-col gap-3">
        <Button
          variant="outline"
          size="lg"
          className="rounded-full w-14 h-14 shadow-lg bg-white"
          onClick={() => router.push('/expenses/import')}
        >
          <Upload className="w-5 h-5" />
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="rounded-full w-14 h-14 shadow-lg bg-white"
          onClick={() => router.push('/expenses/scan')}
        >
          <Camera className="w-5 h-5" />
        </Button>
        <Button
          size="lg"
          className="rounded-full w-14 h-14 shadow-lg text-2xl"
          onClick={() => router.push('/expenses/new')}
        >
          +
        </Button>
      </div>
    </div>
  )
}
