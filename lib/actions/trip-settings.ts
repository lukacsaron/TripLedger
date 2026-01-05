'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db/prisma'

/**
 * Get all category budgets for a specific trip
 */
export async function getTripBudgets(tripId: string) {
    const budgets = await prisma.tripBudget.findMany({
        where: { tripId },
        include: {
            category: true
        }
    })

    return budgets
}

/**
 * Set (create or update) a budget for a category in a trip
 */
export async function setTripBudget(tripId: string, categoryId: string, amount: number) {
    try {
        const budget = await prisma.tripBudget.upsert({
            where: {
                tripId_categoryId: {
                    tripId,
                    categoryId
                }
            },
            update: {
                amount
            },
            create: {
                tripId,
                categoryId,
                amount
            }
        })

        revalidatePath('/settings')
        revalidatePath('/analytics')
        return { success: true, data: budget }
    } catch (error) {
        console.error('Failed to set trip budget:', error)
        return { success: false, error: 'Failed to set trip budget' }
    }
}

/**
 * Remove a budget set for a category in a trip
 */
export async function removeTripBudget(tripId: string, categoryId: string) {
    try {
        await prisma.tripBudget.delete({
            where: {
                tripId_categoryId: {
                    tripId,
                    categoryId
                }
            }
        })

        revalidatePath('/settings')
        revalidatePath('/analytics')
        return { success: true }
    } catch (error) {
        console.error('Failed to remove trip budget:', error)
        return { success: false, error: 'Failed to remove trip budget' }
    }
}
