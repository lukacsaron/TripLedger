/**
 * Trip Selector Component
 * Dropdown to switch between trips with option to create new ones
 */

'use client'

import { useTrips } from '@/lib/hooks/use-trips'
import { useCurrentTrip } from '@/lib/hooks/use-current-trip'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils/formatting'
import { AddTripDialog } from './add-trip-dialog'
import { Plus } from 'lucide-react'
import * as Flags from 'country-flag-icons/react/3x2'

export function TripSelector() {
  const { data: trips, isLoading } = useTrips()
  const { currentTripId, selectTrip } = useCurrentTrip()

  if (isLoading) {
    return <Skeleton className="h-10 w-[200px]" />
  }

  if (!trips || trips.length === 0) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          No trips yet.
        </span>
        <AddTripDialog />
      </div>
    )
  }

  const currentTrip = trips.find(t => t.id === currentTripId)

  return (
    <div className="flex items-center gap-2">
      <Select value={currentTripId || undefined} onValueChange={selectTrip}>
        <SelectTrigger className="w-auto min-w-[200px] h-14 pl-4 pr-3 rounded-2xl bg-white dark:bg-zinc-900 border-none shadow-sm hover:shadow-md transition-all ring-1 ring-black/5 dark:ring-white/10 [&>span]:line-clamp-none [&>span]:flex [&>span]:w-full [&>span]:items-center [&>span]:gap-2.5 [&>span]:overflow-visible">
          <SelectValue>
            {currentTrip ? (
              <div className="flex items-center gap-2.5 w-full">
                {/* Flag Icon - clean, no wrapper */}
                {currentTrip.countryCode && Flags[currentTrip.countryCode as keyof typeof Flags] ? (
                  (() => {
                    const Flag = Flags[currentTrip.countryCode as keyof typeof Flags];
                    return <Flag className="w-6 h-4 shrink-0 rounded-sm" />
                  })()
                ) : (
                  <span className="text-lg shrink-0">✈️</span>
                )}

                <div className="flex flex-col items-start min-w-0">
                  <span className="font-semibold text-foreground text-sm leading-snug truncate w-full text-left">{currentTrip.name}</span>
                  <span className="text-[px] text-muted-foreground uppercase tracking-wide font-medium">
                    {formatDate(currentTrip.startDate, 'MMM yyyy')}
                  </span>
                </div>
              </div>
            ) : (
              <span className="ml-2">Select trip</span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="rounded-xl min-w-[240px]">
          {trips.map(trip => (
            <SelectItem key={trip.id} value={trip.id} className="rounded-lg my-1 cursor-pointer">
              <div className="flex items-center gap-3 py-1">
                <div className="shrink-0 w-8 h-6 rounded overflow-hidden shadow-sm bg-muted/20">
                  {trip.countryCode && Flags[trip.countryCode as keyof typeof Flags] ? (
                    (() => {
                      const Flag = Flags[trip.countryCode as keyof typeof Flags];
                      return <Flag className="w-full h-full object-cover" />
                    })()
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-xs">🌍</div>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">{trip.name}</span>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {formatDate(trip.startDate, 'MMM yyyy')}
                  </span>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <AddTripDialog>
        <button
          className="size-11 rounded-xl shadow-sm bg-white dark:bg-zinc-900 ring-1 ring-black/5 dark:ring-white/10 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-muted-foreground hover:text-foreground"
          title="Create new trip"
        >
          <Plus className="w-5 h-5" />
        </button>
      </AddTripDialog>
    </div>
  )
}

