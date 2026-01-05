'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useTrips } from '@/lib/hooks/use-trips'

const STORAGE_KEY = 'tripledger-current-trip-id'

interface TripContextType {
    currentTripId: string | null
    selectTrip: (tripId: string) => void
    isLoading: boolean
}

const TripContext = createContext<TripContextType | undefined>(undefined)

export function TripProvider({ children }: { children: ReactNode }) {
    const { data: trips, isLoading: tripsLoading } = useTrips()
    const [currentTripId, setCurrentTripId] = useState<string | null>(null)
    const [isInitialized, setIsInitialized] = useState(false)

    useEffect(() => {
        if (tripsLoading) return

        if (!trips || trips.length === 0) {
            setIsInitialized(true)
            return
        }

        const stored = localStorage.getItem(STORAGE_KEY)

        // If we have a stored trip and it exists in the loaded trips
        if (stored && trips.some(trip => trip.id === stored)) {
            setCurrentTripId(stored)
        } else {
            // Default to the most recent trip (first one usually, depending on sort)
            // Assuming api returns sorted, or we pick the first one
            if (trips.length > 0) {
                const defaultTrip = trips[0]
                setCurrentTripId(defaultTrip.id)
                localStorage.setItem(STORAGE_KEY, defaultTrip.id)
            }
        }

        setIsInitialized(true)
    }, [trips, tripsLoading])

    const selectTrip = (tripId: string) => {
        setCurrentTripId(tripId)
        localStorage.setItem(STORAGE_KEY, tripId)
    }

    return (
        <TripContext.Provider
            value={{
                currentTripId,
                selectTrip,
                isLoading: tripsLoading || !isInitialized
            }}
        >
            {children}
        </TripContext.Provider>
    )
}

export function useTripContext() {
    const context = useContext(TripContext)
    if (context === undefined) {
        throw new Error('useTripContext must be used within a TripProvider')
    }
    return context
}
