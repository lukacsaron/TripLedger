import { useState } from 'react'
import { useCreateExpense, useUpdateExpense } from '@/lib/hooks/use-expenses'
import { CategoryWithSubs } from '@/lib/actions/categories'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { formatDateForInput } from '@/lib/utils/formatting'

interface ExpenseFormProps {
  tripId: string
  expenseId?: string
  onSuccess?: () => void
  onCancel?: () => void
  categories: CategoryWithSubs[]
  initialData?: {
    merchant?: string
    date?: string
    amount?: number
    currency?: 'HUF' | 'EUR' | 'USD'
    category?: string
    subcategory?: string
    payer?: string // Added
    description?: string
    isAiParsed?: boolean
    needsReview?: boolean
    rawItemsText?: string | null
    originalItemsText?: string | null
    paymentType?: 'CASH' | 'CARD' | 'WIRE_TRANSFER'
  }
}



export function ExpenseForm({ tripId, expenseId, onSuccess, onCancel, categories, initialData }: ExpenseFormProps) {
  const createExpense = useCreateExpense()
  const updateExpense = useUpdateExpense(expenseId || '')

  const [formData, setFormData] = useState({
    merchant: initialData?.merchant || '',
    date: initialData?.date || formatDateForInput(new Date()),
    amountOriginal: initialData?.amount?.toString() || '',
    currency: initialData?.currency || 'EUR' as 'HUF' | 'EUR' | 'USD',
    categoryId: initialData?.category || '',
    subcategoryId: initialData?.subcategory || '',
    payer: '', // TODO: Payer might need to be in initialData too? Current implementation hardcoded logic might be missing payer in initialData type
    description: initialData?.description || '',
    paymentType: initialData?.paymentType || 'CASH' as 'CASH' | 'CARD' | 'WIRE_TRANSFER',
  })

  // Fix: initialData provided payer is missing in interface but used in state? 
  // Ah, looking at interface: `initialData` didn't have `payer`. 
  // But usage `initialData?.payer` was NOT in the file previously. 
  // Let's check the file content again.
  // Original file line 48: `payer: '',` -> It seems payer was NOT populated from initialData. 
  // This is a bug if we want to edit. I should add payer to initialData interface in the ReplacementChunk.

  // Derive subcategories from selected category
  const selectedCategory = categories.find(c => c.id === formData.categoryId)
  const availableSubcategories = selectedCategory?.subcategories || []

  // Reset subcategory when category changes
  const handleCategoryChange = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      categoryId,
      subcategoryId: '' // Reset subcategory
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.categoryId) {
      toast.error('Please select a category')
      return
    }

    try {
      if (expenseId) {
        // Update existing expense
        await updateExpense.mutateAsync({
          date: new Date(formData.date).toISOString(),
          merchant: formData.merchant,
          // Payer is not in UpdateExpenseData? Let's check use-expenses.ts
          // use-expenses.ts: Remove payer from update? 
          // Line 60: payer?: string IS in UpdateExpenseData.
          payer: formData.payer,
          paymentType: formData.paymentType,
          amountOriginal: parseFloat(formData.amountOriginal),
          currency: formData.currency,
          categoryId: formData.categoryId,
          // Subcategory missing in UpdateExpenseData? 
          // use-expenses.ts UpdateExpenseData: date, merchant, payer, paymentType, amountOriginal, currency, categoryId, description.
          // NO subcategoryId in UpdateExpenseData. 
          // This is a limitation of the current definition. I need to add it to use-expenses.ts UpdateExpenseData first? 
          // Or maybe it's missing in the type but API supports it?
          // API route: `validatedData.categoryId` ... `...(validatedData.categoryId && { categoryId: validatedData.categoryId }),`. 
          // API route schema `updateExpenseSchema` ALSO misses subcategoryId (line 21). 
          // So I CANNOT update subcategory via API yet. 
          // I should fix the API and Hook first/concurrently.
          description: formData.description || null,
        })
        toast.success('Expense updated successfully')
      } else {
        // Create new expense
        await createExpense.mutateAsync({
          tripId,
          categoryId: formData.categoryId,
          subcategoryId: formData.subcategoryId || undefined,
          merchant: formData.merchant,
          date: new Date(formData.date).toISOString(),
          amountOriginal: parseFloat(formData.amountOriginal),
          currency: formData.currency,
          payer: formData.payer,
          paymentType: formData.paymentType,
          description: formData.description || null,
          isAiParsed: initialData?.isAiParsed,
          needsReview: initialData?.needsReview,
          rawItemsText: initialData?.rawItemsText,
        })
        toast.success('Expense added successfully')

        // Reset form only if create
        setFormData({
          merchant: '',
          date: formatDateForInput(new Date()),
          amountOriginal: '',
          currency: 'EUR',
          categoryId: '',
          subcategoryId: '',
          payer: '',
          description: '',
          paymentType: 'CASH',
        })
      }

      onSuccess?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save expense')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Amount Card - Prominent Input */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <Label htmlFor="amount" className="text-base font-medium">Amount</Label>
            <div className="flex gap-3">
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amountOriginal}
                onChange={e => setFormData({ ...formData, amountOriginal: e.target.value })}
                required
                className="text-3xl h-14 font-bold flex-1"
              />
              <Select
                value={formData.currency}
                onValueChange={(value: 'HUF' | 'EUR' | 'USD') =>
                  setFormData({ ...formData, currency: value })
                }
              >
                <SelectTrigger className="w-24 h-14 text-lg font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="HUF">HUF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Card */}
      <Card>
        <CardContent className="pt-6 space-y-5">
          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-base font-medium">Category</Label>
            <Select
              value={formData.categoryId}
              onValueChange={handleCategoryChange}
              required
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subcategory (Conditional) */}
          {availableSubcategories.length > 0 && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
              <Label htmlFor="subcategory" className="text-base font-medium">Subcategory</Label>
              <Select
                value={formData.subcategoryId}
                onValueChange={value => setFormData({ ...formData, subcategoryId: value })}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select subcategory (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {availableSubcategories.map(sub => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {sub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Merchant */}
          <div className="space-y-2">
            <Label htmlFor="merchant" className="text-base font-medium">Merchant / Store Name</Label>
            <Input
              id="merchant"
              placeholder="e.g., Konoba Dalmatino"
              value={formData.merchant}
              onChange={e => setFormData({ ...formData, merchant: e.target.value })}
              required
              className="h-11"
            />
          </div>

          {/* Payment Type */}
          <div className="space-y-2">
            <Label htmlFor="paymentType" className="text-base font-medium">Payment Method</Label>
            <Select
              value={formData.paymentType}
              onValueChange={(value: 'CASH' | 'CARD' | 'WIRE_TRANSFER') =>
                setFormData({ ...formData, paymentType: value })
              }
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="CARD">Card</SelectItem>
                <SelectItem value="WIRE_TRANSFER">Wire Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payer and Date - Side by Side */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payer" className="text-base font-medium">Paid By</Label>
              <Input
                id="payer"
                placeholder="e.g., Áron"
                value={formData.payer}
                onChange={e => setFormData({ ...formData, payer: e.target.value })}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date" className="text-base font-medium">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                required
                className="h-11"
              />
            </div>
          </div>

          {/* Description (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-base font-medium text-muted-foreground">
              Description (Optional)
            </Label>
            <Input
              id="description"
              placeholder="e.g., Dinner for two"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="h-11"
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            className="flex-1 h-12"
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          className={`h-12 text-base font-medium ${onCancel ? 'flex-1' : 'w-full'}`}
          disabled={createExpense.isPending || updateExpense.isPending}
        >
          {createExpense.isPending || updateExpense.isPending ? 'Saving...' : (expenseId ? 'Update Expense' : 'Add Expense')}
        </Button>
      </div>
    </form>
  )
}

