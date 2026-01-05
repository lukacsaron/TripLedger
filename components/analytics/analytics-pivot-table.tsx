'use client'

import { useState } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'
import { cn } from '@/lib/utils'

interface PivotData {
    categoryId: string
    categoryName: string
    categoryColor: string
    budget: number
    totalSpent: number
    subcategories: {
        id: string
        name: string
        totalSpent: number
    }[]
    expensesWithoutSubcategory: number
}

interface AnalyticsPivotTableProps {
    data: PivotData[]
    currency?: 'HUF' | 'EUR' | 'USD'
}

export function AnalyticsPivotTable({ data, currency = 'HUF' }: AnalyticsPivotTableProps) {
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

    const toggleRow = (id: string) => {
        const newExpanded = new Set(expandedRows)
        if (newExpanded.has(id)) {
            newExpanded.delete(id)
        } else {
            newExpanded.add(id)
        }
        setExpandedRows(newExpanded)
    }

    const grandTotalSpent = data.reduce((acc, curr) => acc + curr.totalSpent, 0)
    const grandTotalBudget = data.reduce((acc, curr) => acc + curr.budget, 0)

    return (
        <div className="rounded-md border">
            <div className="grid grid-cols-12 gap-4 p-4 font-medium bg-muted/50 border-b text-sm">
                <div className="col-span-6 md:col-span-5">Category</div>
                <div className="col-span-2 text-right hidden md:block">Budget</div>
                <div className="col-span-3 md:col-span-2 text-right">Actual</div>
                <div className="col-span-3 text-right">Diff</div>
            </div>

            <div className="divide-y">
                {data.map((row) => {
                    const remaining = row.budget > 0 ? row.budget - row.totalSpent : null
                    const isOver = remaining !== null && remaining < 0
                    const percentUsed = row.budget > 0 ? (row.totalSpent / row.budget) * 100 : 0
                    const isExpanded = expandedRows.has(row.categoryId)
                    const hasSubRows = row.subcategories.length > 0 || row.expensesWithoutSubcategory > 0

                    return (
                        <div key={row.categoryId} className="text-sm">
                            <div
                                className={cn(
                                    "grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/30 transition-colors cursor-pointer select-none",
                                    isExpanded && "bg-muted/20"
                                )}
                                onClick={() => toggleRow(row.categoryId)}
                            >
                                <div className="col-span-6 md:col-span-5 flex items-center gap-3">
                                    <button
                                        className={cn(
                                            "p-1 hover:bg-muted rounded text-muted-foreground transition-colors",
                                            !hasSubRows && "invisible"
                                        )}
                                    >
                                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                    </button>
                                    <div
                                        className="w-3 h-3 rounded-full shrink-0"
                                        style={{ backgroundColor: row.categoryColor }}
                                    />
                                    <span className="font-medium truncate">{row.categoryName}</span>
                                </div>

                                <div className="col-span-2 text-right hidden md:block tabular-nums text-muted-foreground">
                                    {row.budget > 0 ? formatCurrency(row.budget, currency) : '-'}
                                </div>

                                <div className="col-span-3 md:col-span-2 text-right tabular-nums font-medium">
                                    {formatCurrency(row.totalSpent, currency)}
                                </div>

                                <div className="col-span-3 text-right tabular-nums">
                                    {remaining !== null ? (
                                        <span className={isOver ? 'text-red-600 font-medium' : 'text-green-600'}>
                                            {formatCurrency(Math.abs(remaining), currency)}
                                            {isOver && ' over'}
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
                                </div>
                            </div>

                            {/* Progress Bar (Visual budget usage) */}
                            {row.budget > 0 && (
                                <div className="h-1 w-full bg-secondary overflow-hidden">
                                    <div
                                        className={cn("h-full", isOver ? "bg-red-500" : "bg-primary/50")}
                                        style={{ width: `${Math.min(percentUsed, 100)}%` }}
                                    />
                                </div>
                            )}

                            {/* Subcategories Expansion */}
                            {isExpanded && (
                                <div className="bg-muted/10 divide-y divide-border/50 border-t border-border/50">
                                    {row.subcategories.map(sub => (
                                        <div key={sub.id} className="grid grid-cols-12 gap-4 py-2 px-4 hover:bg-muted/20 pl-14">
                                            <div className="col-span-6 md:col-span-5 text-muted-foreground flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-border" />
                                                {sub.name}
                                            </div>
                                            <div className="col-span-2 hidden md:block" />
                                            <div className="col-span-3 md:col-span-2 text-right tabular-nums text-muted-foreground">
                                                {formatCurrency(sub.totalSpent, currency)}
                                            </div>
                                            <div className="col-span-3" />
                                        </div>
                                    ))}

                                    {row.expensesWithoutSubcategory > 0 && (
                                        <div className="grid grid-cols-12 gap-4 py-2 px-4 hover:bg-muted/20 pl-14 font-mono text-xs">
                                            <div className="col-span-6 md:col-span-5 text-muted-foreground flex items-center gap-2 italic">
                                                (Uncategorized in {row.categoryName})
                                            </div>
                                            <div className="col-span-2 hidden md:block" />
                                            <div className="col-span-3 md:col-span-2 text-right tabular-nums text-muted-foreground">
                                                {formatCurrency(row.expensesWithoutSubcategory, currency)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Footer / Grand Total */}
            <div className="grid grid-cols-12 gap-4 p-4 font-bold bg-muted border-t text-sm">
                <div className="col-span-6 md:col-span-5">Grand Total</div>
                <div className="col-span-2 text-right hidden md:block">
                    {formatCurrency(grandTotalBudget, currency)}
                </div>
                <div className="col-span-3 md:col-span-2 text-right">
                    {formatCurrency(grandTotalSpent, currency)}
                </div>
                <div className="col-span-3 text-right">
                    {grandTotalBudget > 0 ? (
                        <span className={grandTotalSpent > grandTotalBudget ? 'text-red-600' : 'text-green-600'}>
                            {formatCurrency(Math.abs(grandTotalBudget - grandTotalSpent), currency)}
                        </span>
                    ) : '-'}
                </div>
            </div>
        </div>
    )
}
