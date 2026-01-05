'use client'

import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Camera, Upload, PenLine } from 'lucide-react'

interface AddExpenseModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function AddExpenseModal({ open, onOpenChange }: AddExpenseModalProps) {
    const router = useRouter()

    const handleNavigation = (path: string) => {
        onOpenChange(false)
        router.push(path)
    }

    const options = [
        {
            icon: PenLine,
            title: 'Manual Entry',
            description: 'Enter expense details manually',
            path: '/expenses/new',
            color: 'bg-blue-500 hover:bg-blue-600',
        },
        {
            icon: Camera,
            title: 'Scan Receipt',
            description: 'AI extracts details from photo',
            path: '/expenses/scan',
            color: 'bg-green-500 hover:bg-green-600',
        },
        {
            icon: Upload,
            title: 'Mass Import',
            description: 'Import bank statement CSV',
            path: '/expenses/import',
            color: 'bg-purple-500 hover:bg-purple-600',
        },
    ]

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Add Expense</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3 py-4">
                    {options.map((option) => {
                        const Icon = option.icon
                        return (
                            <Button
                                key={option.path}
                                variant="outline"
                                className="h-auto p-6 flex items-start gap-4 hover:bg-accent"
                                onClick={() => handleNavigation(option.path)}
                            >
                                <div className={`w-12 h-12 rounded-full ${option.color} flex items-center justify-center flex-shrink-0`}>
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="font-semibold text-lg mb-1">{option.title}</div>
                                    <div className="text-sm text-muted-foreground">{option.description}</div>
                                </div>
                            </Button>
                        )
                    })}
                </div>
            </DialogContent>
        </Dialog>
    )
}
