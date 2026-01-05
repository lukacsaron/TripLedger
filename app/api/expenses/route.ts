/**
 * Expenses API Routes
 * POST /api/expenses - Create a new expense
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { convertToHuf, CurrencyCode } from '@/lib/utils/currency'
import { z } from 'zod'

// Validation schema for creating an expense
const createExpenseSchema = z.object({
  tripId: z.string().cuid(),
  categoryId: z.string().cuid(),
  subcategoryId: z.string().cuid().optional(), // Added subcategoryId
  date: z.string().datetime(),
  merchant: z.string().min(1, 'Merchant name is required'),
  payer: z.string().min(1, 'Payer name is required'),
  amountOriginal: z.number().positive('Amount must be greater than 0'),
  currency: z.enum(['HUF', 'EUR', 'USD']),
  paymentType: z.enum(['CASH', 'CARD', 'WIRE_TRANSFER']).optional().default('CASH'),
  description: z.string().optional().nullable(),
  isAiParsed: z.boolean().optional(),
  needsReview: z.boolean().optional(),
  rawItemsText: z.string().optional().nullable(),
})

// POST /api/expenses - Create a new expense
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createExpenseSchema.parse(body)

    // Fetch the trip to get exchange rates
    const trip = await prisma.trip.findUnique({
      where: { id: validatedData.tripId },
    })

    if (!trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      )
    }

    // Verify category exists (Global)
    const category = await prisma.category.findUnique({
      where: {
        id: validatedData.categoryId,
      },
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Verify subcategory if provided
    if (validatedData.subcategoryId) {
      const subcategory = await prisma.subcategory.findFirst({
        where: {
          id: validatedData.subcategoryId,
          categoryId: validatedData.categoryId, // Ensure it belongs to the category
        },
      })

      if (!subcategory) {
        return NextResponse.json(
          { error: 'Subcategory not found or does not belong to the selected category' },
          { status: 400 }
        )
      }
    }

    // Calculate HUF amount using trip's fixed exchange rates
    const amountHuf = convertToHuf(
      validatedData.amountOriginal,
      validatedData.currency as CurrencyCode,
      {
        rateEurToHuf: trip.rateEurToHuf,
        rateUsdToHuf: trip.rateUsdToHuf,
        rateHrkToHuf: trip.rateHrkToHuf,
      }
    )

    // Create the expense
    const expense = await prisma.expense.create({
      data: {
        tripId: validatedData.tripId,
        categoryId: validatedData.categoryId,
        subcategoryId: validatedData.subcategoryId, // Added subcategoryId
        date: new Date(validatedData.date),
        merchant: validatedData.merchant,
        payer: validatedData.payer,
        paymentType: validatedData.paymentType,
        amountOriginal: validatedData.amountOriginal,
        currency: validatedData.currency,
        amountHuf: amountHuf,
        description: validatedData.description || null,
        isAiParsed: validatedData.isAiParsed || false,
        needsReview: validatedData.needsReview || false,
        rawItemsText: validatedData.rawItemsText || null,
      },
      include: {
        category: true,
        subcategory: true, // properties
        trip: true,
      },
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: (error as any).errors },
        { status: 400 }
      )
    }

    console.error('Failed to create expense:', error)
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    )
  }
}
