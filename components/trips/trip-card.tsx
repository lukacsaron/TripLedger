'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Trip, useDeleteTrip } from '@/lib/hooks/use-trips'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Calendar, Wallet, ChevronRight, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { format, differenceInDays } from 'date-fns'
import { useRouter } from 'next/navigation'
import { EditTripDialog } from './edit-trip-dialog'
import { toast } from 'sonner'

interface TripCardProps {
    trip: Trip & {
        stats?: {
            totalSpent: number
            remaining: number
        }
    }
}

export function TripCard({ trip }: TripCardProps) {
    const router = useRouter()
    const deleteTrip = useDeleteTrip()
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)

    // Safe calculation for progress
    // Note: API needs to return stats for the list view, or we need to fetch them
    // Assuming the hook updates will include stats in the list response or we fetch individually.
    // For now, let's assume we might have them or 0.
    const budget = trip.budgetHuf || 0

    // We'll need to update the API to return basic stats for the list view to make this efficient
    // For now, using placeholders if stats missing
    const spent = (trip as any).stats?.totalSpent || 0
    // Visual improvement: cap progress at 100% for the bar itself to avoid overflow, 
    // but keep logic for colors.
    const rawProgress = budget > 0 ? (spent / budget) * 100 : 0
    const progress = Math.min(rawProgress, 100)
    const remaining = budget - spent

    // Date & Cost logic
    const startDate = new Date(trip.startDate)
    const endDate = trip.endDate ? new Date(trip.endDate) : startDate
    // Ensure at least 1 day count for division if it's a day trip, or show 0 nights
    const nights = differenceInDays(endDate, startDate)
    // If nights is 0 (same day), we can show cost/day effectively
    const effectiveDays = nights === 0 ? 1 : nights
    const costPerNight = spent / effectiveDays

    // Helper for image selection
    const getTripImage = (name: string) => {
        const n = name.toLowerCase()
        if (n.includes('cres') || n.includes('beach') || n.includes('sea') || n.includes('horvát') || n.includes('coast')) return '/images/destinations/beach.png'
        if (n.includes('see') || n.includes('lake') || n.includes('balaton') || n.includes('víz')) return '/images/destinations/lake.png'
        if (n.includes('mount') || n.includes('alp') || n.includes('tatra') || n.includes('selmec') || n.includes('kirándulás')) return '/images/destinations/mountain.png'
        return '/images/destinations/city.png'
    }

    const tripImage = getTripImage(trip.name)

    const handleDelete = async () => {
        try {
            await deleteTrip.mutateAsync(trip.id)
            toast.success('Trip deleted')
        } catch (e) {
            toast.error('Failed to delete trip')
        }
    }

    return (
        <>
            <div className="relative group/card h-full">
                {/* Card linking to dashboard - we wrap card content but keep dropdown interactive */}
                <Card
                    className="h-full overflow-hidden hover:shadow-lg transition-all flex flex-col border-transparent hover:border-border ring-1 ring-border/50 relative cursor-pointer p-0 gap-0"
                    onClick={() => router.push(`/dashboard?tripId=${trip.id}`)}
                >
                    {/* Decorative Top Image */}
                    <div className="relative h-48 w-full overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                        <Image
                            src={tripImage}
                            alt={trip.name}
                            fill
                            className="object-cover transition-transform duration-700 group-hover/card:scale-105"
                        />
                        <div className="absolute bottom-4 left-6 right-6 z-20">
                            <h3 className="font-bold text-xl text-white leading-tight shadow-sm">
                                {trip.name}
                            </h3>
                        </div>
                    </div>

                    <CardHeader className="space-y-4 pb-4 pt-4 px-6">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                {/* Title moved to header image, keeping dates here */}
                                <div className="flex items-center text-sm text-muted-foreground gap-1.5">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>{format(new Date(trip.startDate), 'MMM d, yyyy')}</span>
                                    {trip.endDate && (
                                        <>
                                            <span>-</span>
                                            <span>{format(new Date(trip.endDate), 'MMM d, yyyy')}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                            {/* Status Badge */}
                            {new Date(trip.startDate) > new Date() ? (
                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">Upcoming</Badge>
                            ) : (trip.endDate && new Date(trip.endDate) < new Date()) ? (
                                <Badge variant="outline" className="text-muted-foreground border-border/50 bg-muted/20">Past</Badge>
                            ) : (
                                <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
                            )}
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6 flex-1 px-6 pb-4">
                        {(trip.endDate && new Date(trip.endDate) < new Date()) ? (
                            // Past Trip Layout
                            <div className="space-y-3 pt-2">
                                <div className="space-y-1">
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Cost</span>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-bold font-mono tracking-tight">{spent.toLocaleString(undefined, { maximumFractionDigits: 0 })} HUF</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-1">
                                    <div className="space-y-1">
                                        <span className="text-[10px] uppercase text-muted-foreground font-semibold">Budget</span>
                                        <div className="font-mono text-sm font-medium">{budget.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] uppercase text-muted-foreground font-semibold">Outcome</span>
                                        <div className={`font-mono text-sm font-bold ${remaining < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                                            {remaining < 0 ? '+' : '-'}{Math.abs(remaining).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // Active/Future Trip Layout (Original)
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground font-medium">Budget</span>
                                    <span className="font-mono font-medium">{budget.toLocaleString(undefined, { maximumFractionDigits: 0 })} HUF</span>
                                </div>
                                <Progress value={progress} className="h-2 bg-muted"
                                    indicatorClassName={rawProgress > 100 ? 'bg-orange-400' : rawProgress > 85 ? 'bg-yellow-400' : 'bg-primary'}
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <div className="flex gap-1">
                                        <span>Spent:</span>
                                        <span className={(spent > budget && budget > 0) ? 'text-red-500 font-bold' : ''}>{spent.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                    </div>
                                    <div>
                                        {remaining < 0 ? 'Over: ' : 'Left: '}
                                        <span className={remaining < 0 ? 'text-orange-600 font-medium' : 'text-green-600 font-medium'}>
                                            {Math.abs(remaining).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>

                    <CardFooter className="py-4 px-6 text-sm text-muted-foreground flex justify-between items-center border-t bg-muted/5 group-hover/card:bg-muted/10 transition-colors">
                        <div className="flex items-center gap-4 text-xs font-medium">
                            <div className="flex items-center gap-1.5" title="Duration">
                                <Calendar className="w-3.5 h-3.5 text-muted-foreground/70" />
                                <span className="translate-y-[1px]">{nights} {nights === 1 ? 'night' : 'nights'}</span>
                            </div>
                            <div className="flex items-center gap-1.5" title="Average Cost per Night">
                                <Wallet className="w-3.5 h-3.5 text-muted-foreground/70" />
                                <span className="translate-y-[1px]">{Math.round(costPerNight).toLocaleString()} / night</span>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 opacity-0 group-hover/card:opacity-100 transition-all transform group-hover/card:translate-x-1" />
                    </CardFooter>
                </Card>

                {/* Dropdown Menu - Absolute positioned to be clickable without triggering card navigation */}
                <div className="absolute top-4 right-4 z-10" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-transparent">
                                <MoreVertical className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit Settings
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => setIsDeleteOpen(true)}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Trip
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <EditTripDialog trip={trip} open={isEditOpen} onOpenChange={setIsEditOpen} />

                <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete the trip "{trip.name}" and all associated expenses. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
                                Delete Trip
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </>
    )
}
