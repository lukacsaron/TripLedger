/**
 * Dashboard Page
 * Unified trip dashboard with analytics, charts, and transaction management
 */

'use client'

import { useCurrentTrip } from '@/lib/hooks/use-current-trip'
import { useTrip, useTrips } from '@/lib/hooks/use-trips'
import { TripSelector } from '@/components/trips/trip-selector'
import { WelcomeScreen } from '@/components/empty-states'
import { AnalyticsPivotTable } from '@/components/analytics/analytics-pivot-table'
import { TransactionTable } from '@/components/analytics/transaction-table'
import { SpendingDonutChart } from '@/components/analytics/spending-donut-chart'
import { DailySpendingChart } from '@/components/analytics/daily-spending-chart'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useRouter } from 'next/navigation'
import { Camera, Upload } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'

export default function DashboardPage() {
  const router = useRouter()
  const { data: allTrips, isLoading: tripsLoading } = useTrips()
  const { currentTripId, isLoading: tripLoading } = useCurrentTrip()
  const { data: trip, isLoading: tripDataLoading } = useTrip(currentTripId)

  // First time user - no trips at all
  if (!tripsLoading && (!allTrips || allTrips.length === 0)) {
    return <WelcomeScreen onCreateTrip={() => router.push('/trips')} />
  }

  // Loading state
  if (tripLoading || tripsLoading || !currentTripId) {
    return (
      <div className="container max-w-6xl mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (tripDataLoading) {
    return (
      <div className="container max-w-6xl mx-auto p-6 space-y-6">
        <TripSelector />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
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

  const hasExpenses = trip.expenses && trip.expenses.length > 0

  // --- Data Aggregation for Analytics ---

  // Build category map with budgets and expenses
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

  // Add categories from expenses
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

  // Build pivot data
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
      })).sort((a, b) => b.totalSpent - a.totalSpent),
      expensesWithoutSubcategory
    }
  }).sort((a, b) => b.totalSpent - a.totalSpent)

  // Currency breakdown
  const currencyTotals = {
    EUR: trip.expenses.filter((e: any) => e.currency === 'EUR').reduce((sum: number, e: any) => sum + Number(e.amountOriginal), 0),
    USD: trip.expenses.filter((e: any) => e.currency === 'USD').reduce((sum: number, e: any) => sum + Number(e.amountOriginal), 0),
    HUF: trip.expenses.filter((e: any) => e.currency === 'HUF').reduce((sum: number, e: any) => sum + Number(e.amountOriginal), 0),
  }

  const totalSpent = trip.stats.totalSpent
  const budget = trip.budgetHuf
  const remaining = trip.stats.remaining
  const percentSpent = budget > 0 ? (totalSpent / budget) * 100 : 0
  const isOverBudget = remaining < 0

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push('/expenses/scan')}
            className="hidden md:flex"
          >
            <Camera className="w-4 h-4 mr-2" />
            Scan Receipt
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/expenses/import')}
            className="hidden md:flex"
          >
            <Upload className="w-4 h-4 mr-2" />
            Mass Import
          </Button>
          <Button onClick={() => router.push('/expenses/new')}>
            + Add Expense
          </Button>
        </div>
      </div>

      {hasExpenses ? (
        <>
          {/* Hero Section - Total Spent */}
          <div className="text-center space-y-2">
            <div className="text-sm text-muted-foreground">Total Spent</div>
            <div className="amount-display text-5xl md:text-6xl">
              {formatCurrency(totalSpent, 'HUF')}
            </div>
          </div>

          {/* Budget Overview Card */}
          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold">Budget Overview</h3>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Budget</span>
                <span className="font-medium">{formatCurrency(budget, 'HUF')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Spent</span>
                <span className="font-medium">{formatCurrency(totalSpent, 'HUF')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Remaining</span>
                <span className={`font-medium ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(Math.abs(remaining), 'HUF')}
                  {isOverBudget && ' over budget!'}
                </span>
              </div>

              {/* Progress Bar */}
              <Progress
                value={Math.min(percentSpent, 100)}
                className="h-2"
                indicatorClassName={isOverBudget ? 'bg-red-600' : 'bg-primary'}
              />
              <div className="text-xs text-muted-foreground text-right">
                {percentSpent.toFixed(1)}% of budget used
              </div>
            </div>

            {/* Exchange Rates */}
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

          {/* At-a-Glance Metrics */}
          <div className="grid gap-4 md:grid-cols-4">
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

          {/* Visual Analytics - Charts */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Analytics</h2>
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
          </div>

          {/* Category Breakdown */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Category Breakdown</h2>
            <AnalyticsPivotTable data={pivotData} />
          </div>

          {/* All Transactions */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">All Transactions</h2>
            <TransactionTable expenses={trip.expenses} />
          </div>
        </>
      ) : (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <div className="text-xl font-semibold">No expenses yet</div>
            <p className="text-muted-foreground">
              Start tracking your trip expenses by adding your first transaction
            </p>
            <div className="flex gap-2 justify-center pt-4">
              <Button onClick={() => router.push('/expenses/new')}>
                Add Expense
              </Button>
              <Button variant="outline" onClick={() => router.push('/expenses/scan')}>
                Scan Receipt
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Actions - Mobile FAB Style */}
      <div className="fixed bottom-20 right-6 md:hidden flex flex-col gap-3">
        <Button
          variant="outline"
          size="lg"
          className="rounded-full w-14 h-14 shadow-lg bg-background dark:bg-card"
          onClick={() => router.push('/expenses/import')}
          aria-label="Mass Import from CSV"
          title="Mass Import"
        >
          <Upload className="w-5 h-5" />
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="rounded-full w-14 h-14 shadow-lg bg-background dark:bg-card"
          onClick={() => router.push('/expenses/scan')}
          aria-label="Scan Receipt with Camera"
          title="Scan Receipt"
        >
          <Camera className="w-5 h-5" />
        </Button>
        <Button
          size="lg"
          className="rounded-full w-14 h-14 shadow-lg text-2xl"
          onClick={() => router.push('/expenses/new')}
          aria-label="Add Expense Manually"
          title="Add Expense"
        >
          +
        </Button>
      </div>
    </div>
  )
}
