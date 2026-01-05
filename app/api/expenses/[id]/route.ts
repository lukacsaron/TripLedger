/**
 * Expense Detail API Routes
 * GET /api/expenses/[id] - Get single expense
 * PATCH /api/expenses/[id] - Update expense
 * DELETE /api/expenses/[id] - Delete expense
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { convertToHuf } from '@/lib/utils/currency'
import { z } from 'zod'
import { Currency } from '@prisma/client'

// Validation schema for updating an expense
const updateExpenseSchema = z.object({
  date: z.string().datetime().optional(),
  merchant: z.string().min(1).optional(),
  payer: z.string().min(1).optional(),
  amountOriginal: z.number().positive().optional(),
  currency: z.enum(['HUF', 'EUR', 'USD']).optional(),
  categoryId: z.string().cuid().optional(),
  subcategoryId: z.string().cuid().optional().nullable(),
  description: z.string().optional().nullable(),
  paymentType: z.enum(['CASH', 'CARD', 'WIRE_TRANSFER']).optional(), // Also ensure this is here
})

// GET /api/expenses/[id] - Get single expense
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        category: true,
        trip: true,
      },
    })

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    return NextResponse.json(expense)
  } catch (error) {
    console.error('Failed to fetch expense:', error)
    return NextResponse.json(
      { error: 'Failed to fetch expense' },
      { status: 500 }
    )
  }
}

// PATCH /api/expenses/[id] - Update expense
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = updateExpenseSchema.parse(body)

    // Fetch existing expense with trip
    const existing = await prisma.expense.findUnique({
      where: { id },
      include: { trip: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    // If categoryId is being updated, verify it belongs to the trip
    if (validatedData.categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: validatedData.categoryId,
        },
      })

      if (!category) {
        return NextResponse.json(
          { error: 'Category not found or does not belong to this trip' },
          { status: 404 }
        )
      }
    }

    // If amount or currency is being updated, recalculate HUF amount
    let amountHuf = existing.amountHuf
    if (validatedData.amountOriginal || validatedData.currency) {
      const newAmount = validatedData.amountOriginal || existing.amountOriginal.toNumber()
      const newCurrency = (validatedData.currency || existing.currency) as Currency

      amountHuf = convertToHuf(newAmount, newCurrency, {
        rateEurToHuf: existing.trip.rateEurToHuf,
        rateUsdToHuf: existing.trip.rateUsdToHuf,
      })
    }

    // Update the expense
    const expense = await prisma.expense.update({
      where: { id },
      data: {
        ...(validatedData.date && { date: new Date(validatedData.date) }),
        ...(validatedData.merchant && { merchant: validatedData.merchant }),
        ...(validatedData.payer && { payer: validatedData.payer }),
        ...(validatedData.amountOriginal && { amountOriginal: validatedData.amountOriginal }),
        ...(validatedData.currency && { currency: validatedData.currency as Currency }),
        ...(validatedData.categoryId && { categoryId: validatedData.categoryId }),
        ...(validatedData.subcategoryId !== undefined && { subcategoryId: validatedData.subcategoryId }), // Allow setting to null
        ...(validatedData.paymentType && { paymentType: validatedData.paymentType as any }), // Cast because enum vs string
        ...(validatedData.description !== undefined && { description: validatedData.description }),
        amountHuf, // Always update amountHuf if amount or currency changed
      },
      include: {
        category: true,
        trip: true,
      },
    })

    return NextResponse.json(expense)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: (error as any).errors },
        { status: 400 }
      )
    }

    console.error('Failed to update expense:', error)
    return NextResponse.json(
      { error: 'Failed to update expense' },
      { status: 500 }
    )
  }
}

// DELETE /api/expenses/[id] - Delete expense
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if expense exists
    const existing = await prisma.expense.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    // Delete the expense
    await prisma.expense.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete expense:', error)
    return NextResponse.json(
      { error: 'Failed to delete expense' },
      { status: 500 }
    )
  }
}
