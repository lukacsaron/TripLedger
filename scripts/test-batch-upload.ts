
import { prisma } from '../lib/db/prisma';

async function testBatchUpload() {
    console.log('Testing Batch Upload API...');

    // 1. Setup: Create a trip and categories if needed
    const trip = await prisma.trip.create({
        data: {
            name: "Batch Test Trip",
            startDate: new Date(),
            budgetHuf: 100000,
        }
    });
    console.log(`Created test trip: ${trip.id}`);

    // 2. Prepare payload
    const expenses = [
        {
            tripId: trip.id,
            date: new Date().toISOString(),
            merchant: "Batch Test Merchant 1",
            amountOriginal: 10.50,
            currency: "EUR",
            categoryName: "Food",
            description: "Batch Item 1"
        },
        {
            tripId: trip.id,
            date: new Date().toISOString(),
            merchant: "Batch Test Merchant 2",
            amountOriginal: 2500,
            currency: "HUF",
            categoryName: "Transport", // Should default to 'Other' or first available if 'Transport' doesn't exist
            description: "Batch Item 2"
        }
    ];

    // 3. Call API logic directly (simulating request)
    // We can't fetch() from a script easily without running server, so we'll use a mocked fetch or just import the logic?
    // Actually, simplest is to use 'server-only' code pattern or just rely on manual UI test. 
    // But wait, the previous test-receipts.ts was likely running in Node. 
    // Let's use `fetch` against localhost:3000 if the server is running.

    try {
        const res = await fetch('http://localhost:3000/api/expenses/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ expenses })
        });

        if (res.ok) {
            const data = await res.json();
            console.log('Success:', data);
        } else {
            console.error('Failed:', await res.text());
        }
    } catch (e) {
        console.log("Could not reach server, maybe not running? Skipping fetch test, but the script is ready.");
    }

    // Clean up
    await prisma.trip.delete({ where: { id: trip.id } });
    console.log("Cleaned up test trip.");
}

testBatchUpload()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
