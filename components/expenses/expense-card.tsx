/**
 * Expense Card Component
 * Mobile-friendly card for displaying an expense
 */

'use client'

import { Expense } from '@/lib/hooks/use-expenses'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/formatting'
import { Card } from '@/components/ui/card'

interface ExpenseCardProps {
  expense: Expense
  onClick?: () => void
}

export function ExpenseCard({ expense, onClick }: ExpenseCardProps) {
  const showOriginalCurrency = expense.currency !== 'HUF'

  return (
    <Card
      className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        {/* Left side - Icon + Merchant + Details */}
        <div className="flex gap-3 flex-1 min-w-0">
          {/* Category Color Indicator */}
          <div
            className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: expense.category?.color || '#E5E7EB' }}
          >
            {expense.category?.name.slice(0, 2).toUpperCase() || '??'}
          </div>

          {/* Merchant and Details */}
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{expense.merchant}</div>
            <div className="text-sm text-muted-foreground space-x-2">
              <span>{formatDate(expense.date, 'MMM dd')}</span>
              <span>•</span>
              <span>{expense.payer}</span>
            </div>
            {expense.description && (
              <div className="text-xs text-muted-foreground mt-1 truncate">
                {expense.description}
              </div>
            )}
          </div>
        </div>

        {/* Right side - Amount */}
        <div className="text-right flex-shrink-0 ml-4">
          <div className="font-bold text-lg tabular-nums">
            -{formatCurrency(expense.amountHuf, 'HUF')}
          </div>
          {showOriginalCurrency && (
            <div className="text-xs text-muted-foreground tabular-nums">
              {formatCurrency(expense.amountOriginal, expense.currency)}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
