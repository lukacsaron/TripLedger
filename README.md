# TripLedger

A minimalistic, mobile-first holiday expense tracker built with Next.js. Designed with a "Zen Accounting" philosophy – expenses are stressful, the app should be calming.

## Features

- 📸 **AI Receipt Scanner** – Snap a photo, auto-fill expense details using GPT-4o-mini
- 💱 **Fixed Exchange Rates** – Lock rates at trip start for consistent budgeting
- 📊 **Category Budgeting** – Track spending by category with visual breakdowns
- 🏖️ **Multi-Trip Support** – Manage expenses across different holidays
- 📱 **Mobile-First** – Optimized for on-the-go expense capture
- 🖥️ **Desktop Analytics** – Full table views and charts for deep analysis

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** SQLite (via Prisma)
- **AI:** Google Gemini / OpenAI GPT-4o-mini

## Quick Start

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed with sample data (optional)
npm run db:seed

# Start development server
npm run dev
```

## Environment Variables

Create a `.env.local` file:

```env
# OpenAI API Key (for receipt scanning)
OPENAI_API_KEY=sk-...

# Google Gemini API Key (alternative AI provider)
GEMINI_API_KEY=...
```

## Deployment (Coolify/Docker)

```bash
# Build for production
docker build -t tripledger .

# Run container
docker run -p 3000:3000 tripledger
```

See the included `Dockerfile` and `docker-compose.yml` for container configuration.

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── dashboard/         # Main dashboard
│   ├── trips/            # Trip management
│   └── expenses/         # Expense entry/scanning
├── components/            # React components
├── lib/                   # Utilities, hooks, actions
├── prisma/               # Database schema and migrations
└── docs/                 # Documentation
```

## License

MIT
