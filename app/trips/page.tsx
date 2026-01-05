/**
 * Trips Library Page
 * Visual grid view of all trips
 */

'use client'

import { useTrips } from '@/lib/hooks/use-trips'
import { TripCard } from '@/components/trips/trip-card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useState } from 'react'
import { CreateTripDialog } from '@/components/trips/create-trip-dialog'

export default function TripsPage() {
  const { data: trips, isLoading } = useTrips()
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="container max-w-6xl mx-auto p-6 space-y-8">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-8 min-h-screen">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Trips</h1>
          <p className="text-muted-foreground mt-1">Manage your holiday budgets and expenses</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Trip
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trips?.map((trip) => (
          <TripCard key={trip.id} trip={trip} />
        ))}
        {/* Add New Card (Ghost) */}
        {!trips?.length && (
          <div
            role="button"
            onClick={() => setIsCreateOpen(true)}
            className="h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground hover:border-primary/50 hover:bg-muted/50 transition-all cursor-pointer gap-2"
          >
            <Plus className="w-8 h-8 opacity-50" />
            <span className="font-medium">Create your first trip</span>
          </div>
        )}
      </div>

      <CreateTripDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  )
}
