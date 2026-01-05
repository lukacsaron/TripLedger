/**
 * React Query Hooks for Categories
 */

'use client'

import { useQuery } from '@tanstack/react-query'

export interface Subcategory {
  id: string
  name: string
  categoryId: string
}

export interface Category {
  id: string
  name: string
  color: string
  icon: string | null
  budgetCap: number | null
  tripId: string // Note: Global categories might not have tripId? Schema says they are global.
  // Actually schema `Category` model doesn't have `tripId`. 
  // The `Category` interface here seems to match the OLD schema or a specific type.
  // Let's match the Prisma schema content I saw:
  // id, name, color, icon, createdAt.
  // The `tripId` in the interface might be a leftover / mistake. 
  // I will make it optional or remove it, but to avoid breaking other things, I will verify usage.
  // However, for this task, I need `subcategories`.

  subcategories?: Subcategory[]
  createdAt: string
}

// Fetch categories for a trip (Legacy helper?)
export function useCategoriesFromTrip(tripData: any) {
  return tripData?.categories || []
}

// Existing hook (modified to use global API if tripId is null? No, let's keep it separate)
// The original file used /api/trips/${tripId} to get categories.
// But we want GLOBAL categories for the wizard.

export function useGlobalCategories() {
  return useQuery({
    queryKey: ['global-categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error("Failed to fetch categories");
      return await res.json() as Category[];
    }
  });
}
