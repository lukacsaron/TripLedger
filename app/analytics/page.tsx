/**
 * Analytics Page
 * Detailed view of all expenses with category breakdown and transaction table
 */

'use client'

import { useCurrentTrip } from '@/lib/hooks/use-current-trip'
import { useTrip } from '@/lib/hooks/use-trips'
import { AnalyticsPivotTable } from '@/components/analytics/analytics-pivot-table'
import { TransactionTable } from '@/components/analytics/transaction-table'
import { SpendingDonutChart } from '@/components/analytics/spending-donut-chart'
import { DailySpendingChart } from '@/components/analytics/daily-spending-chart'

import { TripSelector } from '@/components/trips/trip-selector'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'

export default function AnalyticsPage() {
  const router = useRouter()
  const { currentTripId, isLoading: tripLoading } = useCurrentTrip()
  const { data: trip, isLoading: tripDataLoading } = useTrip(currentTripId)

  if (tripLoading || !currentTripId) {
    return (
      <div className="container max-w-6xl mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (tripDataLoading) {
    return (
      <div className="container max-w-6xl mx-auto p-6 space-y-6">
        <TripSelector />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="container max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Trip not found</p>
        </div>
      </div>
    )
  }

  // --- Data Aggregation for Pivot Table ---

  // 1. Identify all unique categories involved (either have a budget or have expenses)
  const categoryMap = new Map<string, {
    id: string
    name: string
    color: string
    budget: number
    expenses: typeof trip.expenses
  }>()

  // Add categories from budgets
  trip.tripBudgets?.forEach((tb: any) => {
    categoryMap.set(tb.categoryId, {
      id: tb.categoryId,
      name: tb.category.name,
      color: tb.category.color,
      budget: tb.amount,
      expenses: []
    })
  })

  // Add categories from expenses (and accumulate expenses)
  trip.expenses.forEach((e: any) => {
    if (!categoryMap.has(e.categoryId)) {
      categoryMap.set(e.categoryId, {
        id: e.categoryId,
        name: e.category.name,
        color: e.category.color,
        budget: 0,
        expenses: []
      })
    }
    categoryMap.get(e.categoryId)!.expenses.push(e)
  })

  // 2. Build Pivot Data
  const pivotData = Array.from(categoryMap.values()).map(cat => {
    const totalSpent = cat.expenses.reduce((sum, e) => sum + Number(e.amountHuf), 0)

    // Group by subcategory
    const subMap = new Map<string, { id: string, name: string, total: number }>()
    let expensesWithoutSubcategory = 0

    cat.expenses.forEach(e => {
      if (e.subcategoryId && e.subcategory) {
        if (!subMap.has(e.subcategoryId)) {
          subMap.set(e.subcategoryId, {
            id: e.subcategoryId,
            name: e.subcategory.name,
            total: 0
          })
        }
        subMap.get(e.subcategoryId)!.total += Number(e.amountHuf)
      } else {
        expensesWithoutSubcategory += Number(e.amountHuf)
      }
    })

    return {
      categoryId: cat.id,
      categoryName: cat.name,
      categoryColor: cat.color,
      budget: cat.budget,
      totalSpent,
      subcategories: Array.from(subMap.values()).map(s => ({
        id: s.id,
        name: s.name,
        totalSpent: s.total
      })).sort((a, b) => b.totalSpent - a.totalSpent), // Sort subcats by spend
      expensesWithoutSubcategory
    }
  }).sort((a, b) => b.totalSpent - a.totalSpent) // Sort categories by spend

  // Currency breakdown
  const currencyTotals = {
    EUR: trip.expenses.filter((e: any) => e.currency === 'EUR').reduce((sum: number, e: any) => sum + Number(e.amountOriginal), 0),
    USD: trip.expenses.filter((e: any) => e.currency === 'USD').reduce((sum: number, e: any) => sum + Number(e.amountOriginal), 0),
    HUF: trip.expenses.filter((e: any) => e.currency === 'HUF').reduce((sum: number, e: any) => sum + Number(e.amountOriginal), 0),
  }

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Analytics</h1>
        </div>
        <TripSelector />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="text-sm text-muted-foreground mb-2">Total Spent</div>
          <div className="text-2xl font-bold tabular-nums">
            {formatCurrency(trip.stats.totalSpent, 'HUF')}
          </div>
        </Card>

        {Object.entries(currencyTotals).map(([currency, total]) => {
          if (total === 0) return null
          return (
            <Card key={currency} className="p-6">
              <div className="text-sm text-muted-foreground mb-2">Total {currency}</div>
              <div className="text-2xl font-bold tabular-nums">
                {formatCurrency(total, currency as any)}
              </div>
            </Card>
          )
        })}

        <Card className="p-6">
          <div className="text-sm text-muted-foreground mb-2">Transactions</div>
          <div className="text-2xl font-bold">{trip.expenses.length}</div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <SpendingDonutChart
          data={pivotData}
          totalSpent={trip.stats.totalSpent}
        />
        <DailySpendingChart
          expenses={trip.expenses}
          startDate={trip.startDate}
          endDate={trip.endDate}
        />
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Category Breakdown</h2>
          <AnalyticsPivotTable data={pivotData} />
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Budget Overview</h2>
          <Card className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Budget</span>
              <span className="font-medium text-lg tabular-nums">
                {formatCurrency(trip.budgetHuf, 'HUF')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Spent</span>
              <span className="font-medium text-lg tabular-nums">
                {formatCurrency(trip.stats.totalSpent, 'HUF')}
              </span>
            </div>
            <div className="pt-4 border-t flex justify-between items-center">
              <span className="font-medium">Remaining</span>
              <span className={`font-bold text-xl tabular-nums ${trip.stats.remaining < 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                {formatCurrency(Math.abs(trip.stats.remaining), 'HUF')}
                {trip.stats.remaining < 0 && ' over'}
              </span>
            </div>

            <div className="pt-4 border-t space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Exchange Rates</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>1 EUR</span>
                  <span className="tabular-nums">{trip.rateEurToHuf} HUF</span>
                </div>
                <div className="flex justify-between">
                  <span>1 USD</span>
                  <span className="tabular-nums">{trip.rateUsdToHuf} HUF</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">All Transactions</h2>
        <TransactionTable expenses={trip.expenses} />
      </div>
    </div>
  )
}
