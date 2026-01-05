This is a comprehensive UX/UI plan and technical specification for **"TripLedger"** (working title), a minimalistic holiday expense tracker built with Next.js.

It is designed to transition your workflow from the attached spreadsheets into a modern, mobile-first web application.

---

# 1. Product Philosophy & Design System

*   **Core Vibe:** "Zen Accounting." Expenses are stressful; the app should be calming.
*   **Visual Style:**
    *   **Typography:** Sans-serif, legible (e.g., *Inter* or *Geist*). Large font sizes for monetary values.
    *   **Palette:** White background, stark black text. Categories use soft pastel pills (e.g., Food = Soft Orange, Travel = Soft Blue).
    *   **Ui Library:** **shadcn/ui** (based on Radix UI & Tailwind). It is minimalistic, accessible, and easily customizable.
*   **Responsiveness:**
    *   **Mobile:** Focus on "Capture." Big buttons, thumb-friendly inputs.
    *   **Desktop:** Focus on "Analysis." Table views (like your Excel) and grid layouts for stats.

---

# 2. Core Features Logic

### A. Currency Logic (The "Fixed Rate" System)
Unlike standard apps that use live APIs, this app respects your specific requirements:
1.  **Base Currency:** Always **HUF** (for settlement).
2.  **Transaction Currencies:** EUR, USD, HUF.
3.  **The "Exchange Lock":** Upon creating a trip, the user inputs the "Cash Exchange Rate" (e.g., *I bought EUR at 395 HUF*).
4.  **Calculation:** Every transaction is stored with its `original_amount` and `original_currency`. The app calculates the `settlement_amount` (HUF) on the fly using the locked rate.

### B. The AI OCR Scanner
*   **Model:** OpenAI `gpt-4o-mini` (Note: `gpt-5-mini` is not released yet; 4o-mini is currently the fastest and most cost-effective vision model).
*   **Process:** User snaps photo $\rightarrow$ Image compressed $\rightarrow$ Sent to API $\rightarrow$ JSON returned $\rightarrow$ Form auto-filled.

---

# 3. User Flow & Screens

## Screen 1: The Dashboard (Home)
*   **Header:** Trip Name ("Croatia 2024") + Settings Gear.
*   **Hero Section:**
    *   **Big Number:** Total Spent in HUF.
    *   **Subtext:** Remaining Budget (e.g., "78,000 HUF left").
    *   **Visual:** A simple progress bar.
*   **Quick Actions (Bottom Fixed on Mobile):**
    *   A prominent `+` button (Floating Action Button).
    *   Clicking opens two options: "Manual Entry" or "Scan Receipt".
*   **Recent List:**
    *   List of last 5 items.
    *   *Design:* [Icon] [Merchant Name] [Right: Amount in HUF] [Subtext: Original Currency if different].

## Screen 2: Add Expense (Manual)
*   **Input 1: Amount:** Large input field.
*   **Input 2: Currency Toggle:** Segmented control `[HUF | EUR | USD]`.
*   **Input 3: Category:** Dropdown/Pills (Food, Travel, Accommodation, etc.).
*   **Input 4: Merchant/Description:** Text input.
*   **Input 5: Date:** Defaults to "Today".
*   **Input 6: Payer:** "Áron" or "Katus" (pulled from settings).

## Screen 3: Add Expense (AI Scan)
1.  **Viewfinder:** Simple camera interface or file picker.
2.  **Processing State:** Skeleton loader with text "Reading receipt...".
3.  **Verification:** The "Manual Entry" screen appears, but pre-filled.
    *   *UX Detail:* Fields confidentially recognized are normal text. Low-confidence fields are highlighted yellow for user review.

## Screen 4: Analytics (The "Excel" Replacement)
*   **Summary Cards:**
    *   Total Spent (HUF).
    *   Total EUR / USD spent (Raw).
*   **Category Breakdown:**
    *   Vertical Stacked Bar or Simple List.
    *   *Format:* [Category Name] ...... [Spent] / [Budget] ...... [Difference].
    *   *Color Coding:* If Spent > Budget, text turns Red.
*   **Transaction Table (Desktop View):**
    *   A full-width table mimicking your Excel screenshot (ID, Status, Source, Amount, Target, Category) for deep auditing.

## Screen 5: Trip Settings
*   **Trip Name.**
*   **Set Budget (HUF).**
*   **Set Exchange Rates:**
    *   Input: `1 EUR = [ 395 ] HUF`
    *   Input: `1 USD = [ 360 ] HUF`
*   **Manage Categories:** Add/Remove tags.
*   **Manage Payers:** Add names (e.g., Áron, Katus).

---

# 4. Technical Specification (Next.js Stack)

## Stack Recommendations
*   **Framework:** Next.js 14+ (App Router).
*   **Language:** TypeScript.
*   **Styling:** Tailwind CSS + `shadcn/ui` components.
*   **Database:** PostgreSQL (via Supabase or Neon).
*   **ORM:** Prisma.
*   **State Management:** React Query (TanStack Query) for seamless data fetching/caching.
*   **AI Integration:** Vercel AI SDK.

## Data Model (Prisma Schema)

```prisma
model Trip {
  id          String   @id @default(cuid())
  name        String
  startDate   DateTime
  budgetHuf   Int      @default(0)
  
  // Fixed Rates established at start of trip
  rateEurToHuf Float   @default(1)
  rateUsdToHuf Float   @default(1)

  expenses    Expense[]
  categories  Category[]
}

model Expense {
  id              String   @id @default(cuid())
  tripId          String
  trip            Trip     @relation(fields: [tripId], references: [id])
  
  createdAt       DateTime @default(now())
  date            DateTime // Date on receipt
  
  merchant        String   // "Target name"
  payer           String   // "Source name"
  
  // Money logic
  amountOriginal  Decimal
  currency        Currency // ENUM: HUF, EUR, USD
  amountHuf       Decimal  // Calculated and stored for fast summing
  
  categoryId      String
  category        Category @relation(fields: [categoryId], references: [id])
  subcategory     String?  // Optional description
}

model Category {
  id        String    @id @default(cuid())
  name      String    // e.g., "Élelmiszer"
  budgetCap Int?      // Optional per-category budget
  tripId    String
  trip      Trip      @relation(fields: [tripId], references: [id])
  expenses  Expense[]
}

enum Currency {
  HUF
  EUR
  USD
}
```

## AI Implementation (API Route)

**Prompt Strategy for `gpt-4o-mini`:**

```javascript
// /api/scan-receipt/route.ts
const systemPrompt = `
  You are a receipt scanner for a holiday budget app. 
  Analyze the image and return a JSON object ONLY.
  Fields required:
  - merchant (string): Store name.
  - date (string, ISO format): Date of purchase.
  - amount (number): Total amount.
  - currency (string): Detect currency (EUR, USD, HUF). If uncertain, guess based on address/language.
  - category (string): Suggest one of [Food, Travel, Accommodation, Entertainment, Groceries].
  - description (string): Short summary of items (e.g., "Beer and Pretzels").
`;

// Input: Base64 image
// Output: JSON structure matching the Expense form state.
```

---

# 5. UI Layout Strategy (Wireframe Description)

### Desktop View (The "Admin" Panel)
A **Sidebar Layout**.
*   **Left Sidebar:** Navigation (Overview, Transactions, Settings), Trip Switcher.
*   **Main Content Area:**
    *   **Top:** KPI Cards (Total Spent, Daily Average).
    *   **Middle:** Two columns.
        *   Left (60%): The Data Table (Sortable, Filterable).
        *   Right (40%): Charts (Donut chart for categories) and Budget vs Actual bars.

### Mobile View (The "On-the-Go" Panel)
A **Single Column Layout**.
*   **Top Bar:** Sticky. Shows "Total: 604,505 HUF".
*   **Content:** Cards. Each expense is a card.
    *   *Card Layout:*
        ```text
        [Icon: Food]  Graz Spar           -14,000 HUF
                      Aug 18 • Áron       (34 EUR)
        ```
*   **Bottom Navigation:** [Home] [Add (+)] [Stats].

---

# 6. Implementation Plan (MVP)

1.  **Setup:** Initialize Next.js, install Shadcn/UI (Button, Input, Select, Card, Table).
2.  **Database:** Set up Prisma schema and connect to a free Postgres instance (e.g., Supabase).
3.  **Settings Page:** Build the form to create a trip and set the `rateEurToHuf`.
4.  **Manual Entry:** Build the form to add expenses. Ensure `amountHuf` is calculated:
    *   `if (currency === 'EUR') amountHuf = input * trip.rateEurToHuf`
5.  **Dashboard:** Create the list view and the "Total" calculation.
6.  **AI Integration:** Connect OpenAI API for the camera feature.
7.  **Analytics:** Recreate the "Summary" table from your Excel screenshot using the real data.