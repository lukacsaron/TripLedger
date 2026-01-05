/**
 * React Query Hooks for Expenses
 */

'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export interface Expense {
  id: string
  tripId: string
  categoryId: string
  subcategoryId: string | null
  date: string
  merchant: string
  payer: string
  paymentType: 'CASH' | 'CARD' | 'WIRE_TRANSFER'
  amountOriginal: number
  currency: 'HUF' | 'EUR' | 'USD'
  amountHuf: number
  description: string | null
  createdAt: string
  updatedAt: string
  isAiParsed: boolean
  needsReview: boolean
  rawItemsText: string | null
  category: {
    id: string
    name: string
    color: string
    icon: string | null
  }
  subcategory?: {
    id: string
    name: string
  } | null
  trip?: any
}

export interface CreateExpenseData {
  tripId: string
  categoryId: string
  subcategoryId?: string
  date: string
  merchant: string
  payer: string
  paymentType: 'CASH' | 'CARD' | 'WIRE_TRANSFER'
  amountOriginal: number
  currency: 'HUF' | 'EUR' | 'USD'
  description?: string | null
  isAiParsed?: boolean
  needsReview?: boolean
  rawItemsText?: string | null
  originalItemsText?: string | null
}

export interface UpdateExpenseData {
  date?: string
  merchant?: string
  payer?: string
  paymentType?: 'CASH' | 'CARD' | 'WIRE_TRANSFER'
  amountOriginal?: number
  currency?: 'HUF' | 'EUR' | 'USD'
  categoryId?: string
  subcategoryId?: string | null
  description?: string | null
}

export interface ScanReceiptData {
  image: string // base64
  tripId: string
}

export interface ScanReceiptResult {
  merchant: string
  date: string
  amount: number
  currency: 'EUR' | 'USD' | 'HUF'
  category: string
  description: string
  paymentType?: 'CASH' | 'CARD' | 'WIRE_TRANSFER'
  rawItemsText?: string
  originalItemsText?: string
  confidence: string
}

// Fetch expenses for a trip (via trip detail endpoint)
// Note: We're not creating a separate expenses list endpoint
// since expenses are always fetched in the context of a trip

// Fetch single expense
export function useExpense(id: string | null) {
  return useQuery({
    queryKey: ['expenses', id],
    queryFn: async () => {
      if (!id) throw new Error('Expense ID is required')
      const response = await fetch(`/api/expenses/${id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch expense')
      }
      return response.json() as Promise<Expense>
    },
    enabled: !!id,
  })
}

// Create expense mutation
export function useCreateExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateExpenseData) => {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create expense')
      }

      return response.json()
    },
    onSuccess: (data) => {
      // Invalidate the trip to refresh expenses list and stats
      queryClient.invalidateQueries({ queryKey: ['trips', data.tripId] })
    },
  })
}

// Update expense mutation
export function useUpdateExpense(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateExpenseData) => {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update expense')
      }

      return response.json()
    },
    onSuccess: (data) => {
      // Invalidate the expense and its trip
      queryClient.invalidateQueries({ queryKey: ['expenses', id] })
      queryClient.invalidateQueries({ queryKey: ['trips', data.tripId] })
    },
  })
}

// Delete expense mutation
export function useDeleteExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, tripId }: { id: string; tripId: string }) => {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete expense')
      }

      return { id, tripId }
    },
    onSuccess: (data) => {
      // Invalidate the trip to refresh expenses list and stats
      queryClient.invalidateQueries({ queryKey: ['trips', data.tripId] })
    },
  })
}

// Scan receipt mutation
export function useScanReceipt() {
  return useMutation({
    mutationFn: async (data: ScanReceiptData) => {
      const response = await fetch('/api/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to scan receipt')
      }

      return response.json() as Promise<ScanReceiptResult>
    },
  })
}
