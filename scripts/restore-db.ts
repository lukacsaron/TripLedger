
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

async function restoreBackup() {
    console.log('Starting restoration...');
    const backupPath = path.join(process.cwd(), 'data-backup.json');
    const data = JSON.parse(await fs.readFile(backupPath, 'utf-8'));

    // 1. Categories
    console.log(`Restoring ${data.categories.length} Categories...`);
    for (const item of data.categories) {
        await prisma.category.create({
            data: {
                id: item.id,
                name: item.name,
                color: item.color,
                icon: item.icon,
                createdAt: item.createdAt,
            },
        });
    }

    // 2. Subcategories
    console.log(`Restoring ${data.subcategories.length} Subcategories...`);
    for (const item of data.subcategories) {
        await prisma.subcategory.create({
            data: {
                id: item.id,
                name: item.name,
                categoryId: item.categoryId,
                createdAt: item.createdAt,
            },
        });
    }

    // 3. Trips (with Payer transformation)
    console.log(`Restoring ${data.trips.length} Trips...`);
    for (const item of data.trips) {
        // Transform string[] payers to nested create
        // The backup has 'payers': ["Name1", "Name2"]
        const payersList = (item.payers as string[]) || [];

        await prisma.trip.create({
            data: {
                id: item.id,
                name: item.name,
                countryCode: item.countryCode,
                startDate: item.startDate,
                endDate: item.endDate,
                budgetHuf: item.budgetHuf,
                rateEurToHuf: item.rateEurToHuf,
                rateUsdToHuf: item.rateUsdToHuf,
                rateHrkToHuf: item.rateHrkToHuf,
                defaultPayer: item.defaultPayer,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
                // Create Payers relations
                payers: {
                    create: payersList.map((name) => ({ name })),
                },
            },
        });
    }

    // 4. Trip Budgets
    console.log(`Restoring ${data.tripBudgets.length} Trip Budgets...`);
    for (const item of data.tripBudgets) {
        await prisma.tripBudget.create({
            data: {
                id: item.id,
                amount: item.amount,
                tripId: item.tripId,
                categoryId: item.categoryId,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
            },
        });
    }

    // 5. Expenses
    console.log(`Restoring ${data.expenses.length} Expenses...`);
    for (const item of data.expenses) {
        await prisma.expense.create({
            data: {
                id: item.id,
                tripId: item.tripId,
                date: item.date,
                merchant: item.merchant,
                payer: item.payer,
                paymentType: item.paymentType, // Enum in backup, String in Schema (compatible)
                amountOriginal: item.amountOriginal,
                currency: item.currency, // Enum in backup, String in Schema (compatible)
                amountHuf: item.amountHuf,
                isAiParsed: item.isAiParsed,
                needsReview: item.needsReview,
                rawItemsText: item.rawItemsText,
                categoryId: item.categoryId,
                subcategoryId: item.subcategoryId,
                description: item.description,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
            },
        });
    }

    console.log('✅ Restoration completed successfully!');
}

restoreBackup()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
