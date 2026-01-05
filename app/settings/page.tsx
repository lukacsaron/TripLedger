/**
 * Settings Page
 * Configure trip settings and global categories
 */

export const dynamic = 'force-dynamic'

import { getGlobalCategories } from '@/lib/actions/categories'
// We cannot fetch trip budgets here easily without tripId in params or knowing current trip.
// But current trip is determined on client via localStorage usually or hook.
// IMPORTANT: Server Components cannot access localStorage.
// So we will pass categories to Client component, and let Client fetch trip-specific budgets?
// OR: We fetch all trip budgets for *all* trips? No.
// We should probably let the client component fetch trip budgets since it knows the current trip ID.
// BUT: SettingsClient needs initialCategories. We CAN fetch those here.

// NOTE: We'll modify SettingsClient to fetch TripBudgets using useQuery or similar, 
// OR simpler: we fetch them inside SettingsClient using a server action wrapped in useEffect 
// (since it depends on currentTripId).

import { SettingsClient } from '@/components/settings/settings-client'

export default async function SettingsPage() {
  const categories = await getGlobalCategories()

  // Trip budgets will be loaded by Client Component because we don't know the tripId here on Server (it's in Client State)
  // Actually, we can't easily pass "initialBudgets" from here if we don't know the trip.

  return <SettingsClient initialCategories={categories} initialBudgets={[]} />
}

