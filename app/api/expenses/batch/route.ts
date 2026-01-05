
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { convertToHuf, CurrencyCode } from "@/lib/utils/currency";
import { z } from "zod";

// Schema for a single expense in the batch
const batchExpenseItemSchema = z.object({
    tripId: z.string().cuid(),
    date: z.string().datetime(), // Expecting ISO string
    merchant: z.string().min(1),
    amountOriginal: z.number().positive(),
    currency: z.enum(["HUF", "EUR", "USD", "HRK"]),
    categoryName: z.string().optional(), // Now optional if ID provided
    categoryId: z.string().cuid().optional(), // New
    subcategoryName: z.string().optional(),
    subcategoryId: z.string().cuid().optional(), // New
    paymentType: z.enum(["CASH", "CARD", "WIRE_TRANSFER"]).default("CASH"),
    description: z.string().optional().nullable(),
    isAiParsed: z.boolean().default(true),
    rawItemsText: z.string().optional().nullable(),
    payer: z.string().default("Áron"), // Default if not specified
});

const batchRequestSchema = z.object({
    expenses: z.array(batchExpenseItemSchema),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { expenses } = batchRequestSchema.parse(body);

        if (expenses.length === 0) {
            return NextResponse.json({ count: 0 });
        }

        // Cache categories and subcategories to avoid N+1 queries
        const categories = await prisma.category.findMany({
            include: { subcategories: true },
        });

        // Cache trips for exchange rates
        // We assume all expenses might belong to the same trip or few trips
        const tripIds = Array.from(new Set(expenses.map(e => e.tripId)));
        const trips = await prisma.trip.findMany({
            where: { id: { in: tripIds } },
        });
        const tripMap = new Map(trips.map((t: any) => [t.id, t]));

        let createdCount = 0;

        // Process sequentially to handle relations and potential errors gracefully
        // Using a transaction would be safer but might fail all if one fails. 
        // For mass import, partial success is often better, or we validate everything first.
        // Let's use a transaction for all-or-nothing integrity.

        await prisma.$transaction(async (tx) => {
            for (const item of expenses) {
                const trip: any = tripMap.get(item.tripId);
                if (!trip) {
                    throw new Error(`Trip not found: ${item.tripId}`);
                }

                // 1. Resolve Category
                let categoryId = item.categoryId;
                let category: any = null;

                if (categoryId) {
                    category = categories.find(c => c.id === categoryId);
                }

                // Fallback: Resolve by Name
                if (!category && item.categoryName) {
                    const normalizedCatName = item.categoryName.trim().toLowerCase();
                    category = categories.find(c => c.name.toLowerCase() === normalizedCatName);
                }

                // Fallback: Default to "Other" or first available
                if (!category) {
                    category = categories.find(c => c.name.toLowerCase() === "other") || categories[0];
                }

                categoryId = category.id;

                // 2. Resolve Subcategory
                let subcategoryId = item.subcategoryId || null;

                // If ID provided, verify it belongs to category
                if (subcategoryId) {
                    const sub = category.subcategories.find((s: any) => s.id === subcategoryId);
                    if (!sub) {
                        subcategoryId = null; // Invalid subcategory for this category
                    }
                }

                // Fallback: Resolve by Name if not set yet
                if (!subcategoryId && item.subcategoryName) {
                    const normalizedSubName = item.subcategoryName.trim().toLowerCase();
                    const sub = category.subcategories.find((s: any) => s.name.toLowerCase() === normalizedSubName);
                    if (sub) {
                        subcategoryId = sub.id;
                    }
                }

                // Calculate HUF
                const amountHuf = convertToHuf(
                    item.amountOriginal,
                    item.currency as CurrencyCode,
                    {
                        rateEurToHuf: trip.rateEurToHuf,
                        rateUsdToHuf: trip.rateUsdToHuf,
                        rateHrkToHuf: trip.rateHrkToHuf || 1, // Fallback if undefined in type
                    }
                );

                await tx.expense.create({
                    data: {
                        tripId: item.tripId,
                        categoryId: category.id,
                        subcategoryId: subcategoryId,
                        date: new Date(item.date),
                        merchant: item.merchant,
                        payer: item.payer,
                        paymentType: item.paymentType,
                        amountOriginal: item.amountOriginal,
                        currency: item.currency,
                        amountHuf: amountHuf,
                        description: item.description,
                        isAiParsed: item.isAiParsed,
                        rawItemsText: item.rawItemsText,
                        needsReview: false, // Assumed reviewed in UI
                    }
                });
                createdCount++;
            }
        });

        return NextResponse.json({ count: createdCount, message: "Batch processing successful" });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Validation failed", details: (error as any).errors }, { status: 400 });
        }
        console.error("Batch import failed:", error);
        return NextResponse.json({ error: "Batch processing failed", details: String(error) }, { status: 500 });
    }
}
