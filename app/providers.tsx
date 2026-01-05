/**
 * App Providers
 * Wraps the app with necessary context providers
 */

'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { TripProvider } from '@/components/trips/trip-provider'

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <TripProvider>
        {children}
        <Toaster position="top-center" />
      </TripProvider>
    </QueryClientProvider>
  )
}
