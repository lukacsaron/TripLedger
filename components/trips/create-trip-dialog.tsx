'use client'

import { useState } from 'react'
import { useCreateTrip } from '@/lib/hooks/use-trips'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface CreateTripDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreateTripDialog({ open, onOpenChange }: CreateTripDialogProps) {
    const createTrip = useCreateTrip()

    const [formData, setFormData] = useState({
        name: '',
        startDate: '',
        endDate: '',
        budgetHuf: '0',
        rateEurToHuf: '400',
        rateUsdToHuf: '360',
        rateHrkToHuf: '50',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            await createTrip.mutateAsync({
                name: formData.name,
                startDate: new Date(formData.startDate).toISOString(),
                endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
                budgetHuf: parseInt(formData.budgetHuf) || 0,
                rateEurToHuf: parseFloat(formData.rateEurToHuf),
                rateUsdToHuf: parseFloat(formData.rateUsdToHuf),
                rateHrkToHuf: parseFloat(formData.rateHrkToHuf),
            })

            toast.success('Trip created successfully!')
            onOpenChange(false)

            // Reset form
            setFormData({
                name: '',
                startDate: '',
                endDate: '',
                budgetHuf: '0',
                rateEurToHuf: '400',
                rateUsdToHuf: '360',
                rateHrkToHuf: '50',
            })
        } catch (error) {
            toast.error('Failed to create trip')
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create New Trip</DialogTitle>
                    <DialogDescription>
                        Set up your holiday budget and exchange rates.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Trip Name</Label>
                        <Input
                            id="name"
                            placeholder="Summer Vacation 2024"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="startDate">Start Date</Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="endDate">End Date</Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="budget">Total Budget (HUF)</Label>
                        <Input
                            id="budget"
                            type="number"
                            value={formData.budgetHuf}
                            onChange={(e) => setFormData({ ...formData, budgetHuf: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="eurRate">1 EUR = ? HUF</Label>
                            <Input
                                id="eurRate"
                                type="number"
                                step="0.1"
                                value={formData.rateEurToHuf}
                                onChange={(e) => setFormData({ ...formData, rateEurToHuf: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="usdRate">1 USD = ? HUF</Label>
                            <Input
                                id="usdRate"
                                type="number"
                                step="0.1"
                                value={formData.rateUsdToHuf}
                                onChange={(e) => setFormData({ ...formData, rateUsdToHuf: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="hrkRate">1 HRK = ? HUF</Label>
                            <Input
                                id="hrkRate"
                                type="number"
                                step="0.1"
                                value={formData.rateHrkToHuf}
                                onChange={(e) => setFormData({ ...formData, rateHrkToHuf: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <DialogFooter className="mt-4">
                        <Button type="submit" disabled={createTrip.isPending}>
                            {createTrip.isPending ? 'Creating...' : 'Create Trip'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
