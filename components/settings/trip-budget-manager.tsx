'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { setTripBudget, removeTripBudget } from '@/lib/actions/trip-settings'
import { formatCurrency } from '@/lib/utils/currency'

interface CategorySimple {
    id: string
    name: string
    color: string
}

interface TripBudgetWithCategory {
    id: string
    categoryId: string
    amount: number
    category: CategorySimple
}

interface TripBudgetManagerProps {
    tripId: string
    allCategories: CategorySimple[]
    currentBudgets: TripBudgetWithCategory[]
}

export function TripBudgetManager({ tripId, allCategories, currentBudgets }: TripBudgetManagerProps) {
    const [loading, setLoading] = useState(false)

    const getBudgetForCategory = (catId: string) => {
        return currentBudgets.find(b => b.categoryId === catId)?.amount || 0
    }

    const handleBudgetChange = async (catId: string, amount: string) => {
        // Only update on blur or enter key to avoid too many requests
        // For now, let's just use a save button approach or save on blur
    }

    const handleSaveBudget = async (catId: string, amount: number) => {
        setLoading(true)
        if (amount <= 0) {
            const result = await removeTripBudget(tripId, catId)
            if (result.success) {
                toast.success('Budget removed')
            } else {
                toast.error('Failed to remove budget')
            }
        } else {
            const result = await setTripBudget(tripId, catId, amount)
            if (result.success) {
                toast.success('Budget set')
            } else {
                toast.error('Failed to set budget')
            }
        }
        setLoading(false)
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Category Budgets</h2>
            </div>

            <div className="grid gap-3">
                {allCategories.map(category => {
                    const budget = currentBudgets.find(b => b.categoryId === category.id)
                    const amount = budget ? budget.amount : ''

                    return (
                        <Card key={category.id} className="p-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                                    style={{ backgroundColor: category.color }}
                                >
                                    {category.name.slice(0, 2).toUpperCase()}
                                </div>
                                <span className="font-medium">{category.name}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="relative w-32">
                                    <Input
                                        type="number"
                                        placeholder="No Limit"
                                        defaultValue={amount}
                                        onBlur={(e) => {
                                            const val = parseInt(e.target.value)
                                            if (val !== (budget?.amount || 0)) { // Only if changed
                                                handleSaveBudget(category.id, isNaN(val) ? 0 : val)
                                            }
                                        }}
                                        className="pr-12 text-right"
                                    />
                                    <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">HUF</span>
                                </div>
                            </div>
                        </Card>
                    )
                })}
            </div>
            <p className="text-sm text-muted-foreground mt-4">
                Set a budget of 0 or clear the field to remove the limit.
            </p>
        </div>
    )
}
