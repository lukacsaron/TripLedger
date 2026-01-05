import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

/**
 * GET /api/backup
 * Export all database data as JSON
 */
export async function GET() {
    try {
        // Fetch all data including relations
        const [categories, subcategories, trips, payers, tripBudgets, expenses] = await Promise.all([
            prisma.category.findMany({
                orderBy: { name: 'asc' }
            }),
            prisma.subcategory.findMany({
                orderBy: { name: 'asc' }
            }),
            prisma.trip.findMany({
                orderBy: { startDate: 'desc' }
            }),
            prisma.payer.findMany(),
            prisma.tripBudget.findMany(),
            prisma.expense.findMany({
                orderBy: { date: 'desc' }
            }),
        ])

        const backup = {
            timestamp: new Date().toISOString(),
            version: '1.0',
            data: {
                categories,
                subcategories,
                trips,
                payers,
                tripBudgets,
                expenses,
            },
            stats: {
                categories: categories.length,
                subcategories: subcategories.length,
                trips: trips.length,
                payers: payers.length,
                tripBudgets: tripBudgets.length,
                expenses: expenses.length,
            }
        }

        return NextResponse.json(backup, {
            headers: {
                'Content-Disposition': `attachment; filename="tripledger-backup-${new Date().toISOString().split('T')[0]}.json"`,
            },
        })
    } catch (error) {
        console.error('Backup error:', error)
        return NextResponse.json(
            { error: 'Failed to create backup' },
            { status: 500 }
        )
    }
}
