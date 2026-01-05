'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db/prisma'

export type CategoryWithSubs = {
    id: string
    name: string
    color: string
    icon: string | null
    subcategories: {
        id: string
        name: string
    }[]
}

/**
 * Get all global categories with their subcategories
 */
export async function getGlobalCategories() {
    const categories = await prisma.category.findMany({
        include: {
            subcategories: {
                orderBy: { name: 'asc' }
            }
        },
        orderBy: { name: 'asc' }
    })

    return categories
}

/**
 * Create a new global category
 */
export async function createGlobalCategory(data: {
    name: string
    color: string
    icon?: string
}) {
    try {
        const category = await prisma.category.create({
            data: {
                name: data.name,
                color: data.color,
                icon: data.icon,
            }
        })

        revalidatePath('/settings')
        return { success: true, data: category }
    } catch (error) {
        console.error('Failed to create category:', error)
        return { success: false, error: 'Failed to create category' }
    }
}

/**
 * Update a global category
 */
export async function updateGlobalCategory(id: string, data: {
    name?: string
    color?: string
    icon?: string
}) {
    try {
        const category = await prisma.category.update({
            where: { id },
            data
        })

        revalidatePath('/settings')
        return { success: true, data: category }
    } catch (error) {
        console.error('Failed to update category:', error)
        return { success: false, error: 'Failed to update category' }
    }
}

/**
 * Delete a global category
 * Will fail if it has expenses linked to it
 */
export async function deleteGlobalCategory(id: string) {
    try {
        // Check for expenses
        const expensesCount = await prisma.expense.count({
            where: { categoryId: id }
        })

        if (expensesCount > 0) {
            return {
                success: false,
                error: `Cannot delete category: ${expensesCount} expenses are linked to it.`
            }
        }

        await prisma.category.delete({
            where: { id }
        })

        revalidatePath('/settings')
        return { success: true }
    } catch (error) {
        console.error('Failed to delete category:', error)
        return { success: false, error: 'Failed to delete category' }
    }
}

/**
 * Create a subcategory
 */
export async function createSubcategory(categoryId: string, name: string) {
    try {
        const subcategory = await prisma.subcategory.create({
            data: {
                categoryId,
                name
            }
        })

        revalidatePath('/settings')
        return { success: true, data: subcategory }
    } catch (error) {
        console.error('Failed to create subcategory:', error)
        return { success: false, error: 'Failed to create subcategory' }
    }
}

/**
 * Update a subcategory
 */
export async function updateSubcategory(id: string, name: string) {
    try {
        const subcategory = await prisma.subcategory.update({
            where: { id },
            data: { name }
        })

        revalidatePath('/settings')
        return { success: true, data: subcategory }
    } catch (error) {
        console.error('Failed to update subcategory:', error)
        return { success: false, error: 'Failed to update subcategory' }
    }
}

/**
 * Delete a subcategory
 */
export async function deleteSubcategory(id: string) {
    try {
        // Check for expenses with this subcategory
        const expensesCount = await prisma.expense.count({
            where: { subcategoryId: id }
        })

        if (expensesCount > 0) {
            return {
                success: false,
                error: `Cannot delete subcategory: ${expensesCount} expenses are linked to it.`
            }
        }

        await prisma.subcategory.delete({
            where: { id }
        })

        revalidatePath('/settings')
        return { success: true }
    } catch (error) {
        console.error('Failed to delete subcategory:', error)
        return { success: false, error: 'Failed to delete subcategory' }
    }
}
