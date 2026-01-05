/**
 * React Query Hooks for Trips
 */

'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export interface Trip {
  id: string
  name: string
  countryCode: string | null
  startDate: string
  endDate: string | null
  budgetHuf: number
  rateEurToHuf: number
  rateUsdToHuf: number
  rateHrkToHuf: number
  createdAt: string
  updatedAt: string
  payers: { id: string; name: string }[]
}

export interface TripWithStats extends Trip {
  stats: {
    totalSpent: number
    remaining: number
    expenseCount: number
    categoryBreakdown: {
      categoryId: string
      total: number
    }[]
  }
  tripBudgets: {
    id: string
    tripId: string
    categoryId: string
    amount: number
    category: {
      id: string
      name: string
      color: string
      icon: string | null
    }
  }[]
  expenses: any[]
}

export interface CreateTripData {
  name: string
  countryCode?: string
  startDate: string
  endDate?: string | null
  budgetHuf?: number
  rateEurToHuf?: number
  rateUsdToHuf?: number
  rateHrkToHuf?: number
}

export interface UpdateTripData {
  name?: string
  countryCode?: string
  startDate?: string
  endDate?: string | null
  budgetHuf?: number
  rateEurToHuf?: number
  rateUsdToHuf?: number
  rateHrkToHuf?: number
}

// Fetch all trips
export function useTrips() {
  return useQuery({
    queryKey: ['trips'],
    queryFn: async () => {
      const response = await fetch('/api/trips')
      if (!response.ok) {
        throw new Error('Failed to fetch trips')
      }
      return response.json() as Promise<TripWithStats[]>
    },
  })
}

// Fetch single trip with stats
export function useTrip(id: string | null) {
  return useQuery({
    queryKey: ['trips', id],
    queryFn: async () => {
      if (!id) throw new Error('Trip ID is required')
      const response = await fetch(`/api/trips/${id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch trip')
      }
      return response.json() as Promise<TripWithStats>
    },
    enabled: !!id, // Only run if id is provided
  })
}

// Create trip mutation
export function useCreateTrip() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateTripData) => {
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create trip')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate trips list to refetch
      queryClient.invalidateQueries({ queryKey: ['trips'] })
    },
  })
}

// Update trip mutation
export function useUpdateTrip(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateTripData) => {
      const response = await fetch(`/api/trips/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update trip')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate both the single trip and trips list
      queryClient.invalidateQueries({ queryKey: ['trips', id] })
      queryClient.invalidateQueries({ queryKey: ['trips'] })
    },
  })
}

// Delete trip mutation
export function useDeleteTrip() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/trips/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete trip')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate trips list
      queryClient.invalidateQueries({ queryKey: ['trips'] })
    },
  })
}
