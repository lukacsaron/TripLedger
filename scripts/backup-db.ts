
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

async function privacySafeBackup() {
    console.log('Starting backup...');

    // 1. Fetch all data
    const categories = await prisma.category.findMany();
    const subcategories = await prisma.subcategory.findMany();
    const trips = await prisma.trip.findMany();
    const tripBudgets = await prisma.tripBudget.findMany();
    const expenses = await prisma.expense.findMany();

    const backupData = {
        timestamp: new Date().toISOString(),
        categories,
        subcategories,
        trips,
        tripBudgets,
        expenses,
    };

    // 2. Write to file
    const backupPath = path.join(process.cwd(), 'data-backup.json');
    await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));

    console.log(`✅ Backup completed! Saved to ${backupPath}`);
    console.log(`Stats:`);
    console.log(`- Categories: ${categories.length}`);
    console.log(`- Subcategories: ${subcategories.length}`);
    console.log(`- Trips: ${trips.length}`);
    console.log(`- Expenses: ${expenses.length}`);
}

privacySafeBackup()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
