'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { CategoryManager } from '@/components/settings/category-manager'
import { DatabaseManager } from '@/components/settings/database-manager'
import { CategoryWithSubs } from '@/lib/actions/categories'

interface GlobalSettingsClientProps {
    initialCategories: CategoryWithSubs[]
}

export function GlobalSettingsClient({ initialCategories }: GlobalSettingsClientProps) {
    const router = useRouter()

    return (
        <div className="container max-w-4xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-3xl font-bold">Global Settings</h1>
            </div>

            {/* Category Manager */}
            <CategoryManager categories={initialCategories} />

            {/* Database Backup/Restore */}
            <DatabaseManager />
        </div>
    )
}
