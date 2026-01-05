/**
 * Add Trip Dialog Component
 * Modal form to create a new trip
 */

'use client'

import { useState } from 'react'
import { useCreateTrip } from '@/lib/hooks/use-trips'
import { useCurrentTrip } from '@/lib/hooks/use-current-trip'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import * as Flags from 'country-flag-icons/react/3x2'
import { COMMON_COUNTRIES } from '@/lib/constants/countries'

interface AddTripDialogProps {
    children?: React.ReactNode
}

export function AddTripDialog({ children }: AddTripDialogProps) {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState('')
    const [countryCode, setCountryCode] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [budgetHuf, setBudgetHuf] = useState('')
    const [rateEurToHuf, setRateEurToHuf] = useState('400')
    const [rateUsdToHuf, setRateUsdToHuf] = useState('365')
    const [rateHrkToHuf, setRateHrkToHuf] = useState('50')

    const createTrip = useCreateTrip()
    const { selectTrip } = useCurrentTrip()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!name.trim() || !startDate) {
            toast.error('Please fill in the required fields')
            return
        }

        try {
            const trip = await createTrip.mutateAsync({
                name: name.trim(),
                countryCode: countryCode || undefined, // Pass country code
                startDate: new Date(startDate).toISOString(),
                endDate: endDate ? new Date(endDate).toISOString() : null,
                budgetHuf: budgetHuf ? parseInt(budgetHuf, 10) : 0,
                rateEurToHuf: parseFloat(rateEurToHuf) || 400,
                rateUsdToHuf: parseFloat(rateUsdToHuf) || 365,
                rateHrkToHuf: parseFloat(rateHrkToHuf) || 50,
            })

            toast.success(`Trip "${name}" created!`)

            // Select the new trip
            selectTrip(trip.id)

            // Reset form and close dialog
            setName('')
            setCountryCode('')
            setStartDate('')
            setEndDate('')
            setBudgetHuf('')
            setRateEurToHuf('400')
            setRateUsdToHuf('365')
            setRateHrkToHuf('50')
            setOpen(false)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to create trip')
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="outline" size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        New Trip
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Create New Trip</DialogTitle>
                        <DialogDescription>
                            Add a new trip to track your expenses. Default categories will be created automatically.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {/* Trip Name and Country */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Trip Name *</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. Italy 2024"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="country">Country</Label>
                                <Select value={countryCode} onValueChange={setCountryCode}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select country" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <div className="max-h-[200px] overflow-y-auto">
                                            {COMMON_COUNTRIES.map(code => (
                                                <SelectItem key={code} value={code}>
                                                    <div className="flex items-center gap-2">
                                                        {Flags[code as keyof typeof Flags] && (
                                                            <div className="w-5 h-4 overflow-hidden rounded-[2px] shadow-sm">
                                                                {(() => {
                                                                    const Flag = Flags[code as keyof typeof Flags];
                                                                    return <Flag title={code} />
                                                                })()}
                                                            </div>
                                                        )}
                                                        {new Intl.DisplayNames(['en'], { type: 'region' }).of(code)}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </div>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="startDate">Start Date *</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="endDate">End Date</Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Budget */}
                        <div className="grid gap-2">
                            <Label htmlFor="budget">Budget (HUF)</Label>
                            <Input
                                id="budget"
                                type="number"
                                placeholder="e.g. 500000"
                                value={budgetHuf}
                                onChange={(e) => setBudgetHuf(e.target.value)}
                            />
                        </div>

                        {/* Exchange Rates */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="eurRate">EUR → HUF Rate</Label>
                                <Input
                                    id="eurRate"
                                    type="number"
                                    step="0.01"
                                    placeholder="400"
                                    value={rateEurToHuf}
                                    onChange={(e) => setRateEurToHuf(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="usdRate">USD → HUF Rate</Label>
                                <Input
                                    id="usdRate"
                                    type="number"
                                    step="0.01"
                                    placeholder="365"
                                    value={rateUsdToHuf}
                                    onChange={(e) => setRateUsdToHuf(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="hrkRate">HRK → HUF Rate</Label>
                                <Input
                                    id="hrkRate"
                                    type="number"
                                    step="0.01"
                                    placeholder="50"
                                    value={rateHrkToHuf}
                                    onChange={(e) => setRateHrkToHuf(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={createTrip.isPending}>
                            {createTrip.isPending ? 'Creating...' : 'Create Trip'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
