'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Download, Upload, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function DatabaseManager() {
    const router = useRouter()
    const [isBackingUp, setIsBackingUp] = useState(false)
    const [isRestoring, setIsRestoring] = useState(false)

    const handleBackup = async () => {
        try {
            setIsBackingUp(true)

            const response = await fetch('/api/backup')
            if (!response.ok) {
                throw new Error('Failed to create backup')
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `tripledger-backup-${new Date().toISOString().split('T')[0]}.json`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)

            toast.success('Backup downloaded successfully')
        } catch (error) {
            console.error('Backup error:', error)
            toast.error('Failed to create backup')
        } finally {
            setIsBackingUp(false)
        }
    }

    const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        // Confirm before proceeding
        if (!confirm('⚠️ WARNING: This will replace ALL existing data! Are you absolutely sure you want to restore from this backup? This action cannot be undone.')) {
            event.target.value = '' // Reset file input
            return
        }

        try {
            setIsRestoring(true)

            const text = await file.text()
            const backup = JSON.parse(text)

            const response = await fetch('/api/restore', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(backup),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Failed to restore database')
            }

            toast.success(`Database restored successfully! Imported ${result.stats.trips} trips, ${result.stats.expenses} expenses`)

            // Reload the page to reflect new data
            setTimeout(() => {
                router.refresh()
                window.location.reload()
            }, 1500)
        } catch (error) {
            console.error('Restore error:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to restore database')
        } finally {
            setIsRestoring(false)
            event.target.value = '' // Reset file input
        }
    }

    return (
        <Card className="p-6 space-y-6">
            <div>
                <h2 className="text-xl font-bold mb-4">Database Backup & Restore</h2>
                <Separator className="mb-6" />

                <div className="space-y-6">
                    {/* Backup Section */}
                    <div className="space-y-3">
                        <div>
                            <h3 className="font-medium mb-1">Export Backup</h3>
                            <p className="text-sm text-muted-foreground mb-3">
                                Download all your data as a JSON file for safekeeping or migration.
                            </p>
                        </div>
                        <Button
                            onClick={handleBackup}
                            disabled={isBackingUp}
                            className="w-full sm:w-auto"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            {isBackingUp ? 'Creating Backup...' : 'Download Backup'}
                        </Button>
                    </div>

                    <Separator />

                    {/* Restore Section */}
                    <div className="space-y-3">
                        <div>
                            <h3 className="font-medium mb-1 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600" />
                                Restore from Backup
                            </h3>
                            <p className="text-sm text-muted-foreground mb-3">
                                Replace all current data with a backup file. <strong className="text-red-600">This will delete all existing data!</strong>
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Label
                                htmlFor="restore-file"
                                className="cursor-pointer"
                            >
                                <div className={`flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors ${isRestoring ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    <Upload className="w-4 h-4" />
                                    <span>{isRestoring ? 'Restoring...' : 'Choose Backup File'}</span>
                                </div>
                                <Input
                                    id="restore-file"
                                    type="file"
                                    accept="application/json,.json"
                                    onChange={handleRestore}
                                    disabled={isRestoring}
                                    className="hidden"
                                />
                            </Label>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    )
}
