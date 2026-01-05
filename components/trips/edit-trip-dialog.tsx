'use client'

import { useEffect, useState } from 'react'
import { useUpdateTrip, Trip } from '@/lib/hooks/use-trips'
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

interface EditTripDialogProps {
    trip: Trip
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditTripDialog({ trip, open, onOpenChange }: EditTripDialogProps) {
    const updateTrip = useUpdateTrip(trip.id)

    const [formData, setFormData] = useState({
        name: trip.name,
        startDate: trip.startDate.split('T')[0], // Extract YYYY-MM-DD
        endDate: trip.endDate ? trip.endDate.split('T')[0] : '',
        budgetHuf: trip.budgetHuf.toString(),
        rateEurToHuf: trip.rateEurToHuf.toString(),
        rateUsdToHuf: trip.rateUsdToHuf.toString(),
        rateHrkToHuf: trip.rateHrkToHuf?.toString() || '50',
    })

    // Reset form when trip changes or dialog opens
    useEffect(() => {
        if (open) {
            setFormData({
                name: trip.name,
                startDate: trip.startDate.split('T')[0],
                endDate: trip.endDate ? trip.endDate.split('T')[0] : '',
                budgetHuf: trip.budgetHuf.toString(),
                rateEurToHuf: trip.rateEurToHuf.toString(),
                rateUsdToHuf: trip.rateUsdToHuf.toString(),
                rateHrkToHuf: trip.rateHrkToHuf?.toString() || '50',
            })
        }
    }, [trip, open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            await updateTrip.mutateAsync({
                name: formData.name,
                startDate: new Date(formData.startDate).toISOString(),
                endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
                budgetHuf: parseInt(formData.budgetHuf) || 0,
                rateEurToHuf: parseFloat(formData.rateEurToHuf),
                rateUsdToHuf: parseFloat(formData.rateUsdToHuf),
                rateHrkToHuf: parseFloat(formData.rateHrkToHuf),
            })

            toast.success('Trip updated successfully!')
            onOpenChange(false)
        } catch (error) {
            toast.error('Failed to update trip')
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Trip</DialogTitle>
                    <DialogDescription>
                        Update trip details and exchange rates.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="edit-name">Trip Name</Label>
                        <Input
                            id="edit-name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-startDate">Start Date</Label>
                            <Input
                                id="edit-startDate"
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-endDate">End Date</Label>
                            <Input
                                id="edit-endDate"
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="edit-budget">Total Budget (HUF)</Label>
                        <Input
                            id="edit-budget"
                            type="number"
                            value={formData.budgetHuf}
                            onChange={(e) => setFormData({ ...formData, budgetHuf: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-eurRate">1 EUR = ? HUF</Label>
                            <Input
                                id="edit-eurRate"
                                type="number"
                                step="0.1"
                                value={formData.rateEurToHuf}
                                onChange={(e) => setFormData({ ...formData, rateEurToHuf: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-usdRate">1 USD = ? HUF</Label>
                            <Input
                                id="edit-usdRate"
                                type="number"
                                step="0.1"
                                value={formData.rateUsdToHuf}
                                onChange={(e) => setFormData({ ...formData, rateUsdToHuf: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-hrkRate">1 HRK = ? HUF</Label>
                            <Input
                                id="edit-hrkRate"
                                type="number"
                                step="0.1"
                                value={formData.rateHrkToHuf}
                                onChange={(e) => setFormData({ ...formData, rateHrkToHuf: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <DialogFooter className="mt-4">
                        <Button type="submit" disabled={updateTrip.isPending}>
                            {updateTrip.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
