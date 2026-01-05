import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

/**
 * POST /api/restore
 * Import database backup from JSON
 */

const BackupSchema = z.object({
    timestamp: z.string(),
    version: z.string(),
    data: z.object({
        categories: z.array(z.any()),
        subcategories: z.array(z.any()),
        trips: z.array(z.any()),
        payers: z.array(z.any()),
        tripBudgets: z.array(z.any()),
        expenses: z.array(z.any()),
    }),
})

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // Validate backup structure
        const validated = BackupSchema.parse(body)

        // Delete all existing data (in correct order due to foreign keys)
        await prisma.$transaction(async (tx) => {
            await tx.expense.deleteMany()
            await tx.tripBudget.deleteMany()
            await tx.payer.deleteMany()
            await tx.subcategory.deleteMany()
            await tx.trip.deleteMany()
            await tx.category.deleteMany()

            // Insert data (in correct order due to foreign keys)
            await tx.category.createMany({ data: validated.data.categories })
            await tx.subcategory.createMany({ data: validated.data.subcategories })
            await tx.trip.createMany({ data: validated.data.trips })
            await tx.payer.createMany({ data: validated.data.payers })
            await tx.tripBudget.createMany({ data: validated.data.tripBudgets })
            await tx.expense.createMany({ data: validated.data.expenses })
        })

        return NextResponse.json({
            success: true,
            message: 'Database restored successfully',
            stats: {
                categories: validated.data.categories.length,
                subcategories: validated.data.subcategories.length,
                trips: validated.data.trips.length,
                payers: validated.data.payers.length,
                tripBudgets: validated.data.tripBudgets.length,
                expenses: validated.data.expenses.length,
            }
        })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid backup file format', details: (error as any).issues },
                { status: 400 }
            )
        }

        console.error('Restore error:', error)
        return NextResponse.json(
            { error: 'Failed to restore database' },
            { status: 500 }
        )
    }
}
