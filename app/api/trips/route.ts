/**
 * Trips API Routes
 * GET /api/trips - List all trips
 * POST /api/trips - Create a new trip
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

// Validation schema for creating a trip
const createTripSchema = z.object({
  name: z.string().min(1, 'Trip name is required'),
  countryCode: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional().nullable(),
  budgetHuf: z.number().int().min(0).default(0),
  rateEurToHuf: z.number().positive().default(1),
  rateUsdToHuf: z.number().positive().default(1),
  rateHrkToHuf: z.number().positive().default(1),
})

// GET /api/trips - List all trips with stats
export async function GET() {
  try {
    const trips = await prisma.trip.findMany({
      orderBy: { startDate: 'desc' },
      include: {
        payers: true,
        expenses: {
          select: {
            amountHuf: true,
          },
        },
        _count: {
          select: { expenses: true },
        },
      },
    })

    // Calculate stats and format response
    const tripsWithStats = trips.map((trip) => {
      const totalSpent = trip.expenses.reduce(
        (sum: number, expense: { amountHuf: any }) => sum + Number(expense.amountHuf),
        0
      )

      const { expenses, ...tripData } = trip
      return {
        ...tripData,
        stats: {
          totalSpent,
          remaining: trip.budgetHuf - totalSpent,
        }
      }
    })

    return NextResponse.json(tripsWithStats)
  } catch (error) {
    console.error('Failed to fetch trips:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trips' },
      { status: 500 }
    )
  }
}

// POST /api/trips - Create a new trip
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createTripSchema.parse(body)

    // Ensure default categories exist (Global)
    const defaultCategories = [
      { name: 'Food', color: '#FFD9B3', icon: 'utensils' },
      { name: 'Travel', color: '#B3D9FF', icon: 'plane' },
      { name: 'Accommodation', color: '#C1F0C1', icon: 'hotel' },
      { name: 'Entertainment', color: '#E6C3FF', icon: 'ticket' },
      { name: 'Groceries', color: '#FFF4B3', icon: 'shopping-cart' },
      { name: 'Shopping', color: '#FFB3D9', icon: 'shopping-bag' },
      { name: 'Other', color: '#E5E7EB', icon: 'more-horizontal' },
    ]

    // Create categories if they don't exist
    for (const cat of defaultCategories) {
      // @ts-ignore - Prisma client types might be stale regarding unique constraint
      await prisma.category.upsert({
        where: { name: cat.name },
        update: {},
        create: cat,
      })
    }

    // Fetch all categories to create TripBudgets
    const allCategories = await prisma.category.findMany()

    const trip = await prisma.trip.create({
      data: {
        name: validatedData.name,
        // @ts-ignore - Prisma client types might be stale
        countryCode: validatedData.countryCode,
        startDate: new Date(validatedData.startDate),
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        budgetHuf: validatedData.budgetHuf,
        rateEurToHuf: validatedData.rateEurToHuf,
        rateUsdToHuf: validatedData.rateUsdToHuf,
        rateHrkToHuf: validatedData.rateHrkToHuf,
        // Create TripBudgets for this trip
        // @ts-ignore - Prisma client types might be stale
        tripBudgets: {
          create: allCategories.map((cat) => ({
            categoryId: cat.id,
            amount: 0, // Default budget 0 for now
          })),
        },
      },
      include: {
        // @ts-ignore - Prisma client types might be stale
        tripBudgets: true,
        payers: true,
      },
    })

    return NextResponse.json(trip, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: (error as any).errors },
        { status: 400 }
      )
    }

    console.error('Failed to create trip:', error)
    return NextResponse.json(
      { error: 'Failed to create trip' },
      { status: 500 }
    )
  }
}
