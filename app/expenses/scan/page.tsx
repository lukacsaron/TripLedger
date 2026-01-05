/**
 * AI Receipt Scanner Page
 * Server Component fetching global categories
 */

import { getGlobalCategories } from '@/lib/actions/categories'
import { ScanReceiptClient } from '@/components/expenses/scan-receipt-client'

export default async function ScanReceiptPage() {
  const categories = await getGlobalCategories()

  return <ScanReceiptClient categories={categories} />
}
