'use client'

import { useCurrentTrip } from '@/lib/hooks/use-current-trip'
import { ExpenseForm } from '@/components/expenses/expense-form'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { CategoryWithSubs } from '@/lib/actions/categories'

interface NewExpenseClientProps {
    categories: CategoryWithSubs[]
}

export function NewExpenseClient({ categories }: NewExpenseClientProps) {
    const router = useRouter()
    const { currentTripId, isLoading } = useCurrentTrip()

    if (isLoading || !currentTripId) {
        return (
            <div className="container max-w-2xl mx-auto p-6 space-y-6">
                <Skeleton className="h-10 w-[200px]" />
                <Skeleton className="h-[600px] w-full" />
            </div>
        )
    }

    return (
        <div className="container max-w-2xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-3xl font-bold">Add Expense</h1>
            </div>

            {/* Expense Form */}
            <ExpenseForm
                tripId={currentTripId}
                onSuccess={() => router.push('/dashboard')}
                categories={categories}
            />
        </div>
    )
}
