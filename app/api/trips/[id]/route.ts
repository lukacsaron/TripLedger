/**
 * Trip Detail API Routes
 * GET /api/trips/[id] - Get trip with stats
 * PATCH /api/trips/[id] - Update trip
 * DELETE /api/trips/[id] - Delete trip
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'
import { Decimal } from 'decimal.js'

// Validation schema for updating a trip
const updateTripSchema = z.object({
  name: z.string().min(1).optional(),
  countryCode: z.string().optional().nullable(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional().nullable(),
  budgetHuf: z.number().int().min(0).optional(),
  rateEurToHuf: z.number().positive().optional(),
  rateUsdToHuf: z.number().positive().optional(),
  rateHrkToHuf: z.number().positive().optional(),
})

// GET /api/trips/[id] - Get trip with complete stats
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        tripBudgets: {
          include: {
            category: true,
          },
        },
        expenses: {
          orderBy: { date: 'desc' },
          include: {
            category: true,
            subcategory: true,
          },
        },
      },
    })

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    // Calculate trip statistics
    const totalExpenses = await prisma.expense.aggregate({
      where: { tripId: id },
      _sum: { amountHuf: true },
      _count: true,
    })

    const totalSpent = totalExpenses._sum.amountHuf || new Decimal(0)
    const remaining = new Decimal(trip.budgetHuf).sub(totalSpent)

    // Calculate category breakdowns
    const categoryStats = await prisma.expense.groupBy({
      by: ['categoryId'],
      where: { tripId: id },
      _sum: { amountHuf: true },
    })

    const stats = {
      totalSpent: totalSpent.toNumber(),
      remaining: remaining.toNumber(),
      expenseCount: totalExpenses._count,
      categoryBreakdown: categoryStats.map((stat: any) => ({
        categoryId: stat.categoryId,
        total: stat._sum.amountHuf?.toNumber() || 0,
      })),
    }

    return NextResponse.json({ ...trip, stats })
  } catch (error) {
    console.error('Failed to fetch trip:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trip' },
      { status: 500 }
    )
  }
}

// PATCH /api/trips/[id] - Update trip
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = updateTripSchema.parse(body)

    // Check if trip exists
    const existing = await prisma.trip.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    // Update the trip
    const trip = await prisma.trip.update({
      where: { id },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.countryCode !== undefined && { countryCode: validatedData.countryCode }),
        ...(validatedData.startDate && { startDate: new Date(validatedData.startDate) }),
        ...(validatedData.endDate !== undefined && {
          endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        }),
        ...(validatedData.budgetHuf !== undefined && { budgetHuf: validatedData.budgetHuf }),
        ...(validatedData.rateEurToHuf && { rateEurToHuf: validatedData.rateEurToHuf }),
        ...(validatedData.rateUsdToHuf && { rateUsdToHuf: validatedData.rateUsdToHuf }),
        ...(validatedData.rateHrkToHuf && { rateHrkToHuf: validatedData.rateHrkToHuf }),
      },
      include: {
        tripBudgets: true,
      },
    })

    return NextResponse.json(trip)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: (error as any).errors },
        { status: 400 }
      )
    }

    console.error('Failed to update trip:', error)
    return NextResponse.json(
      { error: 'Failed to update trip' },
      { status: 500 }
    )
  }
}

// DELETE /api/trips/[id] - Delete trip
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if trip exists
    const existing = await prisma.trip.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    // Delete the trip (cascades to expenses and categories)
    await prisma.trip.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete trip:', error)
    return NextResponse.json(
      { error: 'Failed to delete trip' },
      { status: 500 }
    )
  }
}
