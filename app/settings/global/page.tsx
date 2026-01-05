/**
 * Global Settings Page
 * Accessible without a trip - manages categories and database
 */

export const dynamic = 'force-dynamic'

import { getGlobalCategories } from '@/lib/actions/categories'
import { GlobalSettingsClient } from '@/components/settings/global-settings-client'

export default async function GlobalSettingsPage() {
    const categories = await getGlobalCategories()

    return <GlobalSettingsClient initialCategories={categories} />
}
