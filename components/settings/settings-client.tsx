'use client'

import { useState, useEffect } from 'react'
import { useCurrentTrip } from '@/lib/hooks/use-current-trip'
import { useTrip, useUpdateTrip, useDeleteTrip } from '@/lib/hooks/use-trips'
import { TripSelector } from '@/components/trips/trip-selector'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import * as Flags from 'country-flag-icons/react/3x2'
import { COMMON_COUNTRIES } from '@/lib/constants/countries'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatDateForInput } from '@/lib/utils/formatting'
import { CategoryManager } from '@/components/settings/category-manager'
import { TripBudgetManager } from '@/components/settings/trip-budget-manager'
import { CategoryWithSubs } from '@/lib/actions/categories'

interface SettingsClientProps {
    initialCategories: CategoryWithSubs[]
    initialBudgets: any[] // TripBudget[]
}

export function SettingsClient({ initialCategories, initialBudgets }: SettingsClientProps) {
    const router = useRouter()
    const { currentTripId, isLoading: tripLoading } = useCurrentTrip()
    const { data: trip, isLoading: tripDataLoading } = useTrip(currentTripId)
    const updateTrip = useUpdateTrip(currentTripId || '')
    const deleteTrip = useDeleteTrip()

    // We keep categories locally to reflect updates from CategoryManager without full refresh
    // but strictly speaking CategoryManager handles its own state/revalidation.
    // For now let's use the props passed from server which will update on revalidatePath.

    const [formData, setFormData] = useState({
        name: '',
        countryCode: '',
        startDate: '',
        endDate: '',
        budgetHuf: '',
        rateEurToHuf: '',
        rateUsdToHuf: '',
    })

    // Load trip data into form
    useEffect(() => {
        if (trip) {
            setFormData({
                name: trip.name,
                countryCode: trip.countryCode || '',
                startDate: formatDateForInput(trip.startDate),
                endDate: trip.endDate ? formatDateForInput(trip.endDate) : '',
                budgetHuf: trip.budgetHuf.toString(),
                rateEurToHuf: trip.rateEurToHuf.toString(),
                rateUsdToHuf: trip.rateUsdToHuf.toString(),
            })
        }
    }, [trip])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!currentTripId) return

        try {
            await updateTrip.mutateAsync({
                name: formData.name,
                countryCode: formData.countryCode || undefined,
                startDate: new Date(formData.startDate).toISOString(),
                endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
                budgetHuf: parseInt(formData.budgetHuf),
                rateEurToHuf: parseFloat(formData.rateEurToHuf),
                rateUsdToHuf: parseFloat(formData.rateUsdToHuf),
            })

            toast.success('Trip settings updated successfully')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update settings')
        }
    }

    if (tripLoading || !currentTripId) {
        return (
            <div className="container max-w-4xl mx-auto p-6 space-y-6">
                <Skeleton className="h-10 w-[200px]" />
                <Skeleton className="h-96 w-full" />
            </div>
        )
    }

    if (tripDataLoading && !trip) {
        return (
            <div className="container max-w-4xl mx-auto p-6 space-y-6">
                <TripSelector />
                <Skeleton className="h-96 w-full" />
            </div>
        )
    }

    if (!trip) {
        return (
            <div className="container max-w-4xl mx-auto p-6">
                <div className="text-center py-12">
                    <p className="text-muted-foreground">Trip not found</p>
                </div>
            </div>
        )
    }

    return (
        <div className="container max-w-4xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-3xl font-bold">Settings</h1>
                </div>
                <TripSelector />
            </div>

            <Tabs defaultValue="trip" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="trip">Trip Settings</TabsTrigger>
                    <TabsTrigger value="global">Global Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="trip" className="space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Info */}
                        <Card className="p-6 space-y-6">
                            <div>
                                <h2 className="text-xl font-bold mb-4">Basic Information</h2>
                                <Separator className="mb-6" />

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Trip Name</Label>
                                            <Input
                                                id="name"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="country">Country</Label>
                                            <Select
                                                value={formData.countryCode}
                                                onValueChange={(val) => setFormData({ ...formData, countryCode: val })}
                                            >
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

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="startDate">Start Date</Label>
                                            <Input
                                                id="startDate"
                                                type="date"
                                                value={formData.startDate}
                                                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="endDate">End Date (Optional)</Label>
                                            <Input
                                                id="endDate"
                                                type="date"
                                                value={formData.endDate}
                                                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="budgetHuf">Total Budget (HUF)</Label>
                                        <Input
                                            id="budgetHuf"
                                            type="number"
                                            value={formData.budgetHuf}
                                            onChange={e => setFormData({ ...formData, budgetHuf: e.target.value })}
                                            required
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Overall budget for the entire trip
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Exchange Rates */}
                        <Card className="p-6 space-y-6">
                            <div>
                                <h2 className="text-xl font-bold mb-4">Fixed Exchange Rates</h2>
                                <Separator className="mb-6" />

                                <div className="space-y-4">
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                                        <p className="text-sm text-amber-900">
                                            <strong>Important:</strong> These rates are locked for the entire trip. All expenses
                                            will be converted to HUF using these rates. Update carefully!
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="rateEurToHuf">EUR to HUF Rate</Label>
                                        <div className="flex items-center gap-2">
                                            <span className="text-muted-foreground">1 EUR =</span>
                                            <Input
                                                id="rateEurToHuf"
                                                type="number"
                                                step="0.01"
                                                value={formData.rateEurToHuf}
                                                onChange={e => setFormData({ ...formData, rateEurToHuf: e.target.value })}
                                                required
                                                className="flex-1"
                                            />
                                            <span className="text-muted-foreground">HUF</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="rateUsdToHuf">USD to HUF Rate</Label>
                                        <div className="flex items-center gap-2">
                                            <span className="text-muted-foreground">1 USD =</span>
                                            <Input
                                                id="rateUsdToHuf"
                                                type="number"
                                                step="0.01"
                                                value={formData.rateUsdToHuf}
                                                onChange={e => setFormData({ ...formData, rateUsdToHuf: e.target.value })}
                                                required
                                                className="flex-1"
                                            />
                                            <span className="text-muted-foreground">HUF</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Save Button */}
                        <Button
                            type="submit"
                            size="lg"
                            className="w-full"
                            disabled={updateTrip.isPending}
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {updateTrip.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </form>

                    {/* Trip Budgets */}
                    <Separator />
                    <TripBudgetManager
                        tripId={trip.id}
                        allCategories={initialCategories}
                        currentBudgets={initialBudgets}
                    />

                    {/* Danger Zone */}
                    <Separator />
                    <Card className="p-6 border-red-200 bg-red-50/50">
                        <div>
                            <h2 className="text-xl font-bold mb-4 text-red-900">Danger Zone</h2>
                            <Separator className="mb-6 bg-red-200" />

                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="font-medium text-red-900">Delete this trip</h3>
                                    <p className="text-sm text-red-700">
                                        Once you delete a trip, there is no going back. Please be certain.
                                    </p>
                                </div>
                                <Button
                                    variant="destructive"
                                    onClick={() => {
                                        if (confirm('Are you absolutely sure you want to delete this trip? This action cannot be undone.')) {
                                            deleteTrip.mutateAsync(trip.id)
                                                .then(() => {
                                                    toast.success('Trip deleted successfully')
                                                    router.push('/dashboard')
                                                })
                                                .catch((error) => {
                                                    toast.error(error instanceof Error ? error.message : 'Failed to delete trip')
                                                })
                                        }
                                    }}
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Trip
                                </Button>
                            </div>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="global" className="space-y-6">
                    <CategoryManager categories={initialCategories} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
