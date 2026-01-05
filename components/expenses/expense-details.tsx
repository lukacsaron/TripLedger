
"use client";

import { useState } from "react";
import { Expense, useDeleteExpense } from "@/lib/hooks/use-expenses";

import { format } from "date-fns";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, ReceiptText, Calendar, User, CreditCard, Store, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ExpenseDetailsProps {
    expense: Expense | null;
    isOpen: boolean;
    onClose: () => void;
}

import { ExpenseForm } from "./expense-form";
import { useGlobalCategories } from "@/lib/hooks/use-categories";
import { CategoryWithSubs } from "@/lib/actions/categories";
import { Edit2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useUpdateExpense } from "@/lib/hooks/use-expenses";

export function ExpenseDetails({ expense, isOpen, onClose }: ExpenseDetailsProps) {
    const [showOriginal, setShowOriginal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const deleteExpense = useDeleteExpense();
    // Use the expense ID for the update hook. It needs to be conditional if expense is null, 
    // but the component returns null early if expense is null. 
    // However, hooks must handle nulls or be called unconditionally.
    // expense is Expense | null.
    const updateExpense = useUpdateExpense(expense?.id || "");
    const { data: globalCategories } = useGlobalCategories();

    if (!expense) return null;

    const handleDelete = async () => {
        try {
            await deleteExpense.mutateAsync({ id: expense.id, tripId: expense.tripId });
            onClose();
        } catch (error) {
            console.error("Failed to delete", error);
        }
    };

    const category = expense.category;

    // Reset edit mode when dialog closes or expense changes
    if (!isOpen && isEditing) setIsEditing(false);

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-full sm:max-w-md p-0 gap-0 overflow-hidden flex flex-col h-full bg-white dark:bg-zinc-950">

                {/* Header Section with Color Band */}
                <div className={`h-2 w-full`} style={{ backgroundColor: category?.color || "#e5e7eb" }} />

                <SheetTitle className="sr-only">Expense Details</SheetTitle>

                <div className="flex-1 overflow-y-auto">
                    {isEditing ? (
                        <div className="p-6">
                            <div className="mb-6">
                                <h2 className="text-xl font-semibold">Edit Expense</h2>
                            </div>
                            <ExpenseForm
                                tripId={expense.tripId}
                                expenseId={expense.id}
                                categories={(globalCategories as unknown as CategoryWithSubs[]) || []}
                                onSuccess={() => setIsEditing(false)}
                                onCancel={() => setIsEditing(false)}
                                initialData={{
                                    merchant: expense.merchant,
                                    date: expense.date.split('T')[0], // Extract YYYY-MM-DD
                                    amount: expense.amountOriginal,
                                    currency: expense.currency,
                                    category: expense.categoryId,
                                    subcategory: expense.subcategoryId || undefined,
                                    payer: expense.payer,
                                    description: expense.description || undefined,
                                    isAiParsed: expense.isAiParsed,
                                    needsReview: expense.needsReview,
                                    rawItemsText: expense.rawItemsText,
                                    paymentType: expense.paymentType
                                }}
                            />
                        </div>
                    ) : (
                        <>
                            <SheetHeader className="px-6 pt-6 pb-2 space-y-4">
                                <div className="flex justify-between items-start">
                                    <Badge
                                        variant="outline"
                                        className="px-2 py-0.5 text-xs font-normal border-transparent bg-muted/50 text-muted-foreground"
                                    >
                                        {format(new Date(expense.date), "MMMM do, yyyy")}
                                    </Badge>
                                    <div className="flex gap-2">
                                        {expense.isAiParsed && (
                                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-100 gap-1 text-[10px] px-2">
                                                <ReceiptText className="w-3 h-3" />
                                                AI Parsed
                                            </Badge>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                            onClick={() => setIsEditing(true)}
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="text-center space-y-1 py-4">
                                    <div className="flex items-center justify-center gap-1.5 text-4xl font-bold tracking-tight text-foreground">
                                        <span>{expense.amountOriginal.toString()}</span>
                                        <span className="text-2xl text-muted-foreground font-medium">{expense.currency}</span>
                                    </div>
                                    <div className="text-sm text-muted-foreground font-medium">
                                        ≈ {Number(expense.amountHuf).toLocaleString()} HUF
                                    </div>
                                </div>
                            </SheetHeader>

                            <div className="px-6 pb-8 space-y-8">
                                {/* Primary Info Card */}
                                <div className="grid gap-6">
                                    <div className="flex items-center gap-4 group">
                                        <div className="w-10 h-10 rounded-full bg-muted/40 flex items-center justify-center text-muted-foreground group-hover:text-foreground group-hover:bg-muted/60 transition-colors">
                                            <Store className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-0.5">Merchant</div>
                                            <div className="font-semibold text-lg leading-none">{expense.merchant}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 group">
                                        <div
                                            className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm ring-2 ring-white dark:ring-zinc-950"
                                            style={{ backgroundColor: category?.color || "#9ca3af" }}
                                        >
                                            <span className="text-xs font-bold">{category?.name?.[0]}</span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Category</div>

                                            <div className="flex flex-col gap-2">
                                                {/* Category Selector */}
                                                <Select
                                                    value={expense.categoryId}
                                                    onValueChange={async (val: string) => {
                                                        const selectedCat = (globalCategories as unknown as CategoryWithSubs[])?.find(c => c.id === val);
                                                        // Update Category (and reset subcategory)
                                                        try {
                                                            await updateExpense.mutateAsync({
                                                                categoryId: val,
                                                                subcategoryId: null, // Reset subcategory on category change
                                                            });
                                                            toast.success(`Category updated to ${selectedCat?.name}`);
                                                        } catch (err) {
                                                            toast.error("Failed to update category");
                                                        }
                                                    }}
                                                >
                                                    <SelectTrigger className="h-8 border-none p-0 focus:ring-0 shadow-none font-semibold text-lg w-auto justify-start gap-2 bg-transparent hover:bg-transparent data-[state=open]:bg-transparent">
                                                        <SelectValue>{category?.name || "Select Category"}</SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {(globalCategories as unknown as CategoryWithSubs[])?.map(c => (
                                                            <SelectItem key={c.id} value={c.id}>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                                                                    {c.name}
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>

                                                {/* Subcategory Selector (Accessing subcategories from the found category in globalCategories) */}
                                                {(globalCategories as unknown as CategoryWithSubs[])?.find(c => c.id === expense.categoryId)?.subcategories?.length ? (
                                                    <Select
                                                        value={expense.subcategoryId || "none"}
                                                        onValueChange={async (val) => {
                                                            const subId = val === "none" ? null : val;
                                                            try {
                                                                await updateExpense.mutateAsync({
                                                                    subcategoryId: subId
                                                                });
                                                                toast.success("Subcategory updated");
                                                            } catch (err) {
                                                                toast.error("Failed to update subcategory");
                                                            }
                                                        }}
                                                    >
                                                        <SelectTrigger className="h-6 border-none p-0 focus:ring-0 shadow-none text-muted-foreground font-normal text-base w-auto justify-start gap-1 bg-transparent hover:bg-transparent">
                                                            <span>/</span>
                                                            <SelectValue placeholder="Add subcategory">
                                                                {expense.subcategory?.name || "Add subcategory"}
                                                            </SelectValue>
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="none">None</SelectItem>
                                                            {(globalCategories as unknown as CategoryWithSubs[])?.find(c => c.id === expense.categoryId)?.subcategories.map(s => (
                                                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-muted/30 flex items-center justify-center text-muted-foreground">
                                                <CreditCard className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Payment</div>
                                                <div className="font-medium text-sm capitalize">{expense.paymentType?.replace('_', ' ').toLowerCase() || 'Cash'}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-muted/30 flex items-center justify-center text-muted-foreground">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Paid By</div>
                                                <div className="font-medium text-sm">{expense.payer}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                {expense.description && (
                                    <div className="bg-muted/20 rounded-xl p-4 border border-dashed border-muted-foreground/20">
                                        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Note</div>
                                        <p className="text-sm leading-relaxed text-foreground/90">{expense.description}</p>
                                    </div>
                                )}

                                {/* Updated Raw Items List - Receipt Style */}
                                {expense.rawItemsText && (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            {expense.rawItemsText && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold">Receipt Details</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="bg-white dark:bg-zinc-900 border rounded-none shadow-sm relative mx-1">
                                            {/* Zigzag top border effect using css or svg could be cool, keeping it simple for now with a border-t-2 dashed */}
                                            <div className="h-2 w-full border-b border-dashed border-muted-foreground/20" />

                                            <ScrollArea className="h-auto max-h-60 w-full px-4 py-4">
                                                <div className="font-mono text-xs space-y-1.5 text-muted-foreground">
                                                    {expense.rawItemsText.split('\n').map((line, i) => {
                                                        // Simple heuristics to split name and price if possible
                                                        const parts = line.split(':');
                                                        if (parts.length > 1) {
                                                            const price = parts.pop();
                                                            const name = parts.join(':');
                                                            return (
                                                                <div key={i} className="flex justify-between items-baseline gap-4">
                                                                    <span className="text-foreground/80">{name.trim()}</span>
                                                                    <span className="shrink-0 font-medium text-foreground">{price?.trim()}</span>
                                                                </div>
                                                            )
                                                        }
                                                        return <div key={i}>{line}</div>
                                                    })}
                                                </div>
                                            </ScrollArea>

                                            <div className="h-2 w-full border-t border-dashed border-muted-foreground/20" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {!isEditing && (
                    <div className="p-4 border-t bg-muted/5 mt-auto">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20">
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Transaction
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Transaction?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This cannot be undone. This expense will be permanently removed from the trip budget.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
