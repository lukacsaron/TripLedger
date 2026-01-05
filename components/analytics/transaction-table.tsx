/**
 * Transaction Table Component
 * Excel-like table for viewing all expenses
 */

'use client'

import { Expense } from '@/lib/hooks/use-expenses'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/formatting'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useState } from 'react'
import { ExpenseDetails } from '@/components/expenses/expense-details'

interface TransactionTableProps {
  expenses: Expense[]
}

export function TransactionTable({ expenses }: TransactionTableProps) {
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)

  if (!expenses || expenses.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No transactions yet
      </div>
    )
  }

  // Sort expenses
  const sortedExpenses = [...expenses].sort((a, b) => {
    if (sortBy === 'date') {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
    } else {
      const amountA = Number(a.amountHuf)
      const amountB = Number(b.amountHuf)
      return sortOrder === 'desc' ? amountB - amountA : amountA - amountB
    }
  })

  const toggleSort = (column: 'date' | 'amount') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => toggleSort('date')}
            >
              Date {sortBy === 'date' && (sortOrder === 'desc' ? '↓' : '↑')}
            </TableHead>
            <TableHead>Merchant</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Payer</TableHead>
            <TableHead className="text-right">Original Amount</TableHead>
            <TableHead
              className="text-right cursor-pointer hover:bg-muted/50"
              onClick={() => toggleSort('amount')}
            >
              Amount (HUF) {sortBy === 'amount' && (sortOrder === 'desc' ? '↓' : '↑')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedExpenses.map((expense) => (
            <TableRow
              key={expense.id}
              className="hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => setSelectedExpense(expense)}
            >
              <TableCell className="font-medium">
                {formatDate(expense.date, 'MMM dd, yyyy')}
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{expense.merchant}</div>
                  {expense.description && (
                    <div className="text-xs text-muted-foreground w-40 truncate">
                      {expense.description}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: expense.category?.color }}
                  />
                  <span className="text-sm">{expense.category?.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-sm">{expense.payer}</TableCell>
              <TableCell className="text-right tabular-nums text-sm">
                {formatCurrency(expense.amountOriginal, expense.currency)}
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {formatCurrency(expense.amountHuf, 'HUF')}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Summary Row */}
      <div className="border-t bg-muted/50 p-4 flex justify-between items-center">
        <div className="text-sm font-medium">
          Total: {expenses.length} transaction{expenses.length !== 1 ? 's' : ''}
        </div>
        <div className="text-lg font-bold tabular-nums">
          {formatCurrency(
            expenses.reduce((sum, e) => sum + Number(e.amountHuf), 0),
            'HUF'
          )}
        </div>
      </div>

      <ExpenseDetails
        expense={selectedExpense}
        isOpen={!!selectedExpense}
        onClose={() => setSelectedExpense(null)}
      />
    </div>
  )
}
