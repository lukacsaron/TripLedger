/**
 * Expense List Component
 * Displays a list of expenses using expense cards
 */

'use client'

import { Expense } from '@/lib/hooks/use-expenses'
import { ExpenseCard } from './expense-card'
import { ExpenseDetails } from './expense-details'
import { useState } from 'react'

interface ExpenseListProps {
  expenses: Expense[]
  onExpenseClick?: (expense: Expense) => void
  emptyMessage?: string
}

export function ExpenseList({
  expenses,
  onExpenseClick,
  emptyMessage = 'No expenses yet',
}: ExpenseListProps) {
  if (!expenses || expenses.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {emptyMessage}
      </div>
    )
  }

  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)

  const handleExpenseClick = (expense: Expense) => {
    setSelectedExpense(expense)
    onExpenseClick?.(expense)
  }

  return (
    <>
      <div className="space-y-3">
        {expenses.map(expense => (
          <ExpenseCard
            key={expense.id}
            expense={expense}
            onClick={() => handleExpenseClick(expense)}
          />
        ))}
      </div>

      <ExpenseDetails
        expense={selectedExpense}
        isOpen={!!selectedExpense}
        onClose={() => setSelectedExpense(null)}
      />
    </>
  )
}
