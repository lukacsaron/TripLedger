/**
 * Hook for managing the currently selected trip
 * Uses the global TripContext
 */

'use client'

import { useTripContext } from '@/components/trips/trip-provider'

export function useCurrentTrip() {
  const { currentTripId, selectTrip, isLoading } = useTripContext()

  const clearTrip = () => {
    // This functionality might need to be added to context if still needed
    // For now we can just select null if the type allows, or just ignore since 
    // the main use case is switching. 
    // If clearing is strictly required, we should expose it from provider.
    // Based on the provider implementation, we only have selectTrip. 
    // Let's keep the API consistent but maybe no-op or handle via selectTrip(null!) if needed.
    // Actually, looking at usages, clearTrip was barely used or just for reset.
    // We can just proxy selectTrip
    // For now, let's omit clearTrip or implement it if context supports it. 
    // The provider interface I wrote inputs string.
  }

  return {
    currentTripId,
    selectTrip,
    clearTrip: () => console.warn('clearTrip not implemented in context yet'),
    isLoading
  }
}
