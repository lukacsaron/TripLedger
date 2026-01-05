/**
 * New Expense Page
 * Server Component fetching global categories
 */

import { getGlobalCategories } from '@/lib/actions/categories'
import { NewExpenseClient } from '@/components/expenses/new-expense-client'

export default async function NewExpensePage() {
  const categories = await getGlobalCategories()

  return <NewExpenseClient categories={categories} />
}
