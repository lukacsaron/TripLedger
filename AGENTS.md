# AGENTS.md

Guidelines for AI coding agents working on this codebase.

## Project Context

TripLedger is a holiday expense tracker with AI receipt scanning. Key design principles:
- "Zen Accounting" – calming, minimal UI
- Mobile-first for expense capture
- Desktop-optimized for analytics

## Tech Stack

- Next.js 16 (App Router)
- TypeScript (strict mode)
- Tailwind CSS + shadcn/ui
- SQLite via Prisma ORM
- React Query for data fetching

## Code Conventions

### File Organization
- Components in `components/` with subdirectories by feature
- API routes in `app/api/`
- Shared utilities in `lib/`
- Prisma schema in `prisma/schema.prisma`

### Styling
- Use the design system in `app/globals.css`
- Always implement light AND dark mode support
- Use shadcn/ui components where available

### Database
- SQLite is the database provider (no native enums, no array fields)
- Use `String` for enum-like fields (e.g., `currency`, `paymentType`)
- Use relation tables instead of arrays (e.g., `Payer` model)

### API Routes
- Validate with Zod schemas
- Return proper HTTP status codes
- Include error messages in JSON responses

### State Management
- React Query for server state
- Hooks in `lib/hooks/`

## User Rules (Always Follow)

1. Do not use browser testing
2. Review work before proceeding
3. Always implement light AND dark mode
4. User journey and product lovability is paramount
5. Optimize for batch operations and fast execution
6. Data security is top priority

## Common Tasks

### Adding a New Expense Field
1. Update `prisma/schema.prisma`
2. Run `npx prisma generate && npx prisma db push`
3. Update API route validation schemas
4. Update frontend form and interfaces

### Running the App
```bash
npm run dev
```

### Database Operations
```bash
npx prisma studio    # Visual DB editor
npx prisma db push   # Sync schema to DB
npx prisma generate  # Regenerate client
```
