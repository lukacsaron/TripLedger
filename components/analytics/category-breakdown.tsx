/**
 * Category Breakdown Component
 * Shows spending by category with donut chart and summary table
 */

'use client'

import { formatCurrency } from '@/lib/utils/currency'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface CategoryStat {
  id: string
  name: string
  color: string
  total: number
  budgetCap?: number | null
  expenseCount: number
}

interface CategoryBreakdownProps {
  categories: CategoryStat[]
}

export function CategoryBreakdown({ categories }: CategoryBreakdownProps) {
  // Sort by total spending (highest first)
  const sortedCategories = [...categories].sort((a, b) => b.total - a.total)
  const grandTotal = sortedCategories.reduce((sum, cat) => sum + cat.total, 0)

  if (sortedCategories.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            No expenses yet
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate segments for donut chart
  let cumulativePercent = 0
  const segments = sortedCategories.map(cat => {
    const percent = grandTotal > 0 ? (cat.total / grandTotal) * 100 : 0
    const segment = {
      ...cat,
      percent,
      startPercent: cumulativePercent,
    }
    cumulativePercent += percent
    return segment
  })

  // Generate conic-gradient for donut chart
  const gradientStops = segments
    .map(seg => `${seg.color} ${seg.startPercent}% ${seg.startPercent + seg.percent}%`)
    .join(', ')

  return (
    <div className="space-y-6">
      {/* Donut Chart */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Chart */}
            <div className="relative">
              <div
                className="w-48 h-48 rounded-full"
                style={{
                  background: `conic-gradient(${gradientStops})`,
                }}
              />
              {/* Inner circle for donut effect */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-28 h-28 rounded-full bg-background flex flex-col items-center justify-center">
                  <span className="text-xs text-muted-foreground">Total</span>
                  <span className="text-lg font-bold tabular-nums">
                    {formatCurrency(grandTotal, 'HUF')}
                  </span>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="flex-1 grid grid-cols-2 gap-3">
              {segments.map(cat => (
                <div key={cat.id} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{cat.name}</div>
                    <div className="text-xs text-muted-foreground tabular-nums">
                      {cat.percent.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Category Details</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Expenses</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">% of Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {segments.map(cat => (
                <TableRow key={cat.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="font-medium">{cat.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {cat.expenseCount}
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {formatCurrency(cat.total, 'HUF')}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {cat.percent.toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
              {/* Total Row */}
              <TableRow className="border-t-2 font-bold">
                <TableCell>Total</TableCell>
                <TableCell className="text-right tabular-nums">
                  {sortedCategories.reduce((sum, cat) => sum + cat.expenseCount, 0)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(grandTotal, 'HUF')}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  100%
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

