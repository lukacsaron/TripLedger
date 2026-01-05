'use client'

import { useState, useRef } from 'react'
import { useCurrentTrip } from '@/lib/hooks/use-current-trip'
import { useTrip } from '@/lib/hooks/use-trips'
import { useScanReceipt } from '@/lib/hooks/use-expenses'
import { ExpenseForm } from '@/components/expenses/expense-form'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Camera, Upload, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { CategoryWithSubs } from '@/lib/actions/categories'

interface ScanReceiptClientProps {
    categories: CategoryWithSubs[]
}

export function ScanReceiptClient({ categories }: ScanReceiptClientProps) {
    const router = useRouter()
    const { currentTripId, isLoading: tripLoading } = useCurrentTrip()
    const { data: trip } = useTrip(currentTripId)
    const scanReceipt = useScanReceipt()

    const fileInputRef = useRef<HTMLInputElement>(null)
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const [scannedData, setScannedData] = useState<any>(null)

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file')
            return
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast.error('Image too large. Please select an image under 10MB')
            return
        }

        // Convert to base64
        const reader = new FileReader()
        reader.onload = async (event) => {
            const base64 = event.target?.result as string
            setSelectedImage(base64)

            // Scan the receipt
            if (!currentTripId) return

            try {
                const result = await scanReceipt.mutateAsync({
                    image: base64,
                    tripId: currentTripId,
                })

                // Find matching category from GLOBAL categories
                const matchingCategory = categories.find(
                    c => c.name.toLowerCase() === result.category.toLowerCase()
                )

                setScannedData({
                    merchant: result.merchant,
                    date: result.date,
                    amount: result.amount,
                    currency: result.currency,
                    category: matchingCategory?.id || '',
                    description: result.description,
                    paymentType: result.paymentType,
                    isAiParsed: true,
                    needsReview: false,
                    rawItemsText: result.rawItemsText,
                })

                toast.success('Receipt scanned successfully!')
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Failed to scan receipt')
                setSelectedImage(null)
            }
        }

        reader.readAsDataURL(file)
    }

    if (tripLoading || !currentTripId) {
        return (
            <div className="container max-w-2xl mx-auto p-6 space-y-6">
                <Skeleton className="h-10 w-[200px]" />
                <Skeleton className="h-96 w-full" />
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
                <h1 className="text-3xl font-bold">Scan Receipt</h1>
            </div>

            {/* Upload Section */}
            {!scannedData && (
                <Card className="p-8">
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <Camera className="w-16 h-16 mx-auto text-muted-foreground" />
                            <h2 className="text-xl font-semibold">Upload Receipt Photo</h2>
                            <p className="text-sm text-muted-foreground">
                                AI will extract merchant, amount, date, and category
                            </p>
                        </div>

                        {selectedImage && (
                            <div className="relative">
                                <img
                                    src={selectedImage}
                                    alt="Selected receipt"
                                    className="w-full max-h-96 object-contain rounded-lg border"
                                />
                                {scanReceipt.isPending && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                                        <div className="text-center text-white space-y-2">
                                            <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                                            <p>Scanning receipt...</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                            capture="environment"
                        />

                        <div className="grid gap-3 md:grid-cols-2">
                            <Button
                                size="lg"
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={scanReceipt.isPending}
                                className="h-16"
                            >
                                <Upload className="w-5 h-5 mr-2" />
                                Upload Photo
                            </Button>

                            <Button
                                size="lg"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={scanReceipt.isPending}
                                className="h-16"
                            >
                                <Camera className="w-5 h-5 mr-2" />
                                Take Photo
                            </Button>
                        </div>

                        <div className="text-xs text-center text-muted-foreground space-y-1">
                            <p>Supported formats: JPG, PNG, HEIC</p>
                            <p>Maximum size: 10MB</p>
                        </div>
                    </div>
                </Card>
            )}

            {/* Scanned Data - Show Prefilled Form */}
            {scannedData && (
                <div className="space-y-6">
                    <Card className="p-4 bg-green-50 border-green-200">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center flex-shrink-0 mt-1">
                                ✓
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-green-900">Receipt Scanned Successfully!</h3>
                                <p className="text-sm text-green-800 mt-1">
                                    Please review the extracted information below and make any necessary corrections.
                                </p>
                            </div>
                        </div>
                    </Card>

                    {selectedImage && (
                        <Card className="p-4">
                            <img
                                src={selectedImage}
                                alt="Scanned receipt"
                                className="w-full max-h-48 object-contain rounded"
                            />
                        </Card>
                    )}

                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold">Verify & Save</h2>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setScannedData(null)
                                    setSelectedImage(null)
                                }}
                            >
                                Scan Another
                            </Button>
                        </div>

                        <ExpenseForm
                            tripId={currentTripId}
                            initialData={scannedData}
                            categories={categories}
                            onSuccess={() => router.push('/dashboard')}
                        />
                    </div>
                </div>
            )}

            {/* Manual Entry Option */}
            {!scannedData && !scanReceipt.isPending && (
                <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-3">
                        Having trouble scanning? You can also:
                    </p>
                    <Button
                        variant="link"
                        onClick={() => router.push('/expenses/new')}
                    >
                        Enter expense manually
                    </Button>
                </div>
            )}
        </div>
    )
}
