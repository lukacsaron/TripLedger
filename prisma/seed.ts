import { PrismaClient } from '@prisma/client'
import { Decimal } from 'decimal.js'

const prisma = new PrismaClient()

// Pastel colors for "Zen Accounting" aesthetic
const CATEGORY_COLORS = {
  Food: '#FFD9B3',           // Soft Orange
  Travel: '#B3D9FF',         // Soft Blue
  Accommodation: '#C1F0C1',  // Soft Green
  Entertainment: '#E6C3FF',  // Soft Purple
  Groceries: '#FFF4B3',      // Soft Yellow
  Shopping: '#FFB3D9',       // Soft Pink
  Other: '#E5E7EB',          // Gray
}

async function main() {
  console.log('🌱 Starting database seed...')

  // Clean existing data (optional - remove in production)
  await prisma.expense.deleteMany()
  await prisma.category.deleteMany()
  await prisma.trip.deleteMany()

  // Create a sample trip
  const trip = await prisma.trip.create({
    data: {
      name: 'Croatia 2024',
      startDate: new Date('2024-08-15'),
      endDate: new Date('2024-08-25'),
      budgetHuf: 800000, // 800,000 HUF budget
      rateEurToHuf: 395,  // 1 EUR = 395 HUF
      rateUsdToHuf: 360,  // 1 USD = 360 HUF
    },
  })

  console.log(`✅ Created trip: ${trip.name}`)

  // Create global categories
  const categories = await Promise.all(
    Object.entries(CATEGORY_COLORS).map(([name, color]) =>
      prisma.category.upsert({
        where: { name },
        update: { color },
        create: {
          name,
          color,
        },
      })
    )
  )

  console.log(`✅ Created ${categories.length} categories`)

  // Find specific categories for sample expenses
  const foodCategory = categories.find(c => c.name === 'Food')!
  const travelCategory = categories.find(c => c.name === 'Travel')!
  const accommodationCategory = categories.find(c => c.name === 'Accommodation')!

  // Create Trip Budgets
  await prisma.tripBudget.createMany({
    data: [
      { tripId: trip.id, categoryId: foodCategory.id, amount: 200000 },
      { tripId: trip.id, categoryId: accommodationCategory.id, amount: 300000 },
    ],
  })
  console.log(`✅ Created trip budgets`)

  // Create sample expenses
  const expenses = await prisma.expense.createMany({
    data: [
      {
        tripId: trip.id,
        categoryId: accommodationCategory.id,
        date: new Date('2024-08-15'),
        merchant: 'Dubrovnik Airbnb',
        payer: 'Áron',
        amountOriginal: new Decimal(250),
        currency: 'EUR',
        amountHuf: new Decimal(250).mul(trip.rateEurToHuf), // 98,750 HUF
        description: '5 nights accommodation',
      },
      {
        tripId: trip.id,
        categoryId: travelCategory.id,
        date: new Date('2024-08-15'),
        merchant: 'Ryanair',
        payer: 'Katus',
        amountOriginal: new Decimal(120),
        currency: 'EUR',
        amountHuf: new Decimal(120).mul(trip.rateEurToHuf), // 47,400 HUF
        description: 'Flight tickets',
      },
      {
        tripId: trip.id,
        categoryId: foodCategory.id,
        date: new Date('2024-08-16'),
        merchant: 'Konoba Dalmatino',
        payer: 'Áron',
        amountOriginal: new Decimal(45),
        currency: 'EUR',
        amountHuf: new Decimal(45).mul(trip.rateEurToHuf), // 17,775 HUF
        description: 'Dinner for two',
      },
      {
        tripId: trip.id,
        categoryId: foodCategory.id,
        date: new Date('2024-08-17'),
        merchant: 'Graz Spar',
        payer: 'Katus',
        amountOriginal: new Decimal(34),
        currency: 'EUR',
        amountHuf: new Decimal(34).mul(trip.rateEurToHuf), // 13,430 HUF
        description: 'Groceries',
      },
      {
        tripId: trip.id,
        categoryId: travelCategory.id,
        date: new Date('2024-08-18'),
        merchant: 'Car Rental',
        payer: 'Áron',
        amountOriginal: new Decimal(180),
        currency: 'EUR',
        amountHuf: new Decimal(180).mul(trip.rateEurToHuf), // 71,100 HUF
        description: 'Week car rental',
      },
    ],
  })

  console.log(`✅ Created ${expenses.count} sample expenses`)

  // Calculate total spent
  const totalExpenses = await prisma.expense.aggregate({
    where: { tripId: trip.id },
    _sum: { amountHuf: true },
  })

  const totalSpent = totalExpenses._sum.amountHuf || new Decimal(0)
  const remaining = new Decimal(trip.budgetHuf).sub(totalSpent)

  console.log('\n📊 Trip Summary:')
  console.log(`   Budget: ${trip.budgetHuf.toLocaleString()} HUF`)
  console.log(`   Spent: ${totalSpent.toFixed(0)} HUF`)
  console.log(`   Remaining: ${remaining.toFixed(0)} HUF`)
  console.log('\n🎉 Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
