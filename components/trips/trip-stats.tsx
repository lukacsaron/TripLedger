/**
 * Trip Stats Component
 * Shows total spent, budget remaining, and progress bar
 */

'use client'

import { useTrip } from '@/lib/hooks/use-trips'
import { formatCurrency } from '@/lib/utils/currency'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Decimal } from 'decimal.js'

interface TripStatsProps {
  tripId: string
}

export function TripStats({ tripId }: TripStatsProps) {
  const { data: trip, isLoading } = useTrip(tripId)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
    )
  }

  if (!trip) {
    return <div className="text-sm text-muted-foreground">Trip not found</div>
  }

  const totalSpent = trip.stats.totalSpent
  const budget = trip.budgetHuf
  const remaining = trip.stats.remaining
  const percentSpent = budget > 0 ? (totalSpent / budget) * 100 : 0

  const isOverBudget = remaining < 0

  return (
    <div className="space-y-4">
      {/* Total Spent - Big Number */}
      <div className="text-center space-y-2">
        <div className="text-sm text-muted-foreground">Total Spent</div>
        <div className="amount-display text-5xl md:text-6xl">
          {formatCurrency(totalSpent, 'HUF')}
        </div>
      </div>

      {/* Budget Info */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Budget</span>
          <span className="font-medium">{formatCurrency(budget, 'HUF')}</span>
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

      {/* Currency Breakdown */}
      <div className="pt-4 border-t space-y-2">
        <div className="text-xs font-medium text-muted-foreground">
          Currency Breakdown
        </div>
        <div className="grid grid-cols-3 gap-2 text-sm">
          {['EUR', 'USD', 'HUF'].map(currency => {
            const currencyExpenses = trip.expenses?.filter(
              (e: any) => e.currency === currency
            )
            const total = currencyExpenses?.reduce(
              (sum: number, e: any) => sum + Number(e.amountOriginal),
              0
            )

            if (!total || total === 0) return null

            return (
              <div key={currency} className="text-center p-2 bg-muted rounded">
                <div className="text-xs text-muted-foreground">{currency}</div>
                <div className="font-medium">
                  {formatCurrency(total, currency as any)}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
