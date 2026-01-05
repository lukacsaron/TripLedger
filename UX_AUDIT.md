# TripLedger UX & Product Audit

**Auditor:** Senior Product Owner & UX Researcher
**Date:** 2026-01-04
**User Persona:** Single user (Áron), travels with partner (Katus), needs expense tracking with currency conversion

---

## 🎯 User Persona Analysis

### Primary User: Áron
- **Context:** Travels internationally with partner
- **Pain Point:** Excel spreadsheets are cumbersome on mobile
- **Goal:** Quick expense capture during trip, detailed analysis after
- **Devices:** Mobile (primary for capture), Desktop (for analysis)
- **Technical Skill:** High (uses Claude Code, understands APIs)

### Secondary User: Katus
- **Context:** Travel partner, shares expenses
- **Need:** Transparency on who paid what
- **Goal:** Fair expense settlement after trip

### Key Usage Scenarios
1. **On-the-go:** At restaurant, just paid bill, wants to log quickly
2. **Receipt handling:** Has paper receipt, wants to scan
3. **Daily review:** Evening, reviewing day's expenses
4. **Post-trip:** Settling up, analyzing spending patterns
5. **Planning:** Setting budget for next trip based on past data

---

## 🔍 Critical User Journeys

### Journey 1: First-Time User (BROKEN ❌)
**Current Flow:**
1. Opens app → Redirects to /dashboard
2. Dashboard loads → Shows loading skeleton
3. No trip exists → ERROR: useCurrentTrip has no fallback
4. **BLOCKED** - User stuck

**Issues:**
- ❌ No empty state for "no trips"
- ❌ No onboarding flow
- ❌ Dashboard expects trip to exist
- ❌ Confusing error state

**Fixed Flow Should Be:**
1. Opens app → Checks for trips
2. No trips → Show welcome screen with CTA "Create Your First Trip"
3. Click CTA → Trip creation modal
4. After creation → Redirect to dashboard with tutorial tooltip

---

### Journey 2: Quick Expense Entry (INCOMPLETE ⚠️)
**Current Flow:**
1. Dashboard → Click "+ Add Expense"
2. Navigate to /expenses/new
3. Fill 7 fields (Amount, Currency, Category, Merchant, Payer, Date, Description)
4. Submit → Navigate back

**Time Estimate:** 60-90 seconds

**Issues:**
- ⚠️ Too many required fields for quick entry
- ❌ No smart defaults (payer, category)
- ❌ No "Last used" suggestions
- ❌ Payer is free text (typo risk: "Aron" vs "Áron")
- ❌ No "Add another" quick action
- ⚠️ Category dropdown not sorted by frequency

**Optimal Flow:**
1. Dashboard → Click FAB (mobile) or "+ Add"
2. Quick modal with just: Amount, Currency, Category
3. Auto-fill: Payer (last used), Date (today), Merchant (optional)
4. Submit → Stay in modal, show "Add Another" or "Done"

**Target Time:** 15-20 seconds

---

### Journey 3: Expense Settlement (MISSING ❌)
**Current Flow:**
1. Trip ends
2. Check analytics for total
3. **MANUAL CALCULATION NEEDED** - Who owes whom?

**Issues:**
- ❌ No payer breakdown (Áron paid: X, Katus paid: Y)
- ❌ No settlement calculation (Katus owes Áron: Z)
- ❌ No export for sharing

**Should Have:**
```
Settlement Summary:
├─ Áron paid:     450,000 HUF (55%)
├─ Katus paid:    350,000 HUF (45%)
└─ Settlement:    Katus owes Áron 50,000 HUF
```

---

### Journey 4: Receipt Scanning (RISKY ⚠️)
**Current Flow:**
1. Navigate to /expenses/scan
2. Upload photo
3. Wait for AI
4. Review pre-filled form
5. Submit

**Issues:**
- ⚠️ No guidance on photo quality
- ❌ No examples shown
- ❌ No confidence scores displayed
- ⚠️ If scan fails, user has to re-navigate
- ❌ No way to retry with different photo

**Improvements Needed:**
- Add photo tips: "Ensure receipt is flat, well-lit, all text visible"
- Show example good/bad photos
- Display AI confidence per field
- Highlight low-confidence fields
- "Retry scan" button

---

### Journey 5: Multi-Trip Management (INCOMPLETE ⚠️)
**Current Flow:**
1. Dashboard → Trip selector dropdown
2. Select different trip
3. Dashboard reloads

**Issues:**
- ⚠️ No trip stats in selector (which trip has most expenses?)
- ❌ Can't compare trips
- ❌ No trip archival
- ❌ No trip status (Active, Completed, Archived)
- ❌ All trips shown equally (no prioritization)

---

## 📊 Screen-by-Screen Audit

### Dashboard (/dashboard)

**Current Elements:**
✅ Trip selector
✅ Trip stats (total, budget, progress)
✅ Recent expenses (last 10)
✅ Add Expense button
✅ Mobile FAB

**Missing Elements:**
❌ **Empty state** - No expenses yet
❌ **Date range indicator** - "Trip: Aug 15-25" or "Ended 3 days ago"
❌ **Daily average** - "Avg: 50,000 HUF/day"
❌ **Days remaining** - "5 days left" (if trip ongoing)
❌ **Payer breakdown** - Quick glance at who paid
❌ **Quick stats cards** - Biggest expense, most spent category
❌ **Scan receipt CTA** - Prominent on mobile
❌ **Tutorial tooltip** - First-time user guidance

**UX Issues:**
⚠️ Recent expenses - No pagination or "View All" for trips with many expenses
⚠️ Progress bar - No color coding (green if under budget, red if over)
⚠️ Currency breakdown - Shows raw totals but no context

**Proposed Improvements:**
```
Dashboard Layout:
├─ Header: Trip selector + "Scan Receipt" button
├─ Hero: Total spent (large) + Days indicator
├─ Quick Stats Row:
│  ├─ Budget Progress (colored)
│  ├─ Daily Average
│  └─ Payer Split (Áron: 60%, Katus: 40%)
├─ Action Cards:
│  ├─ [+ Quick Add] [📷 Scan Receipt]
├─ Recent Expenses (5 most recent)
└─ Footer: [View All] → Analytics
```

---

### Add Expense (/expenses/new)

**Current Fields:**
1. Amount (required, large)
2. Currency (required, toggle)
3. Category (required, dropdown)
4. Merchant (required, text)
5. Payer (required, free text) ← **PROBLEM**
6. Date (required, defaults today)
7. Description (optional, text)

**Issues:**
❌ **Payer is free text** - Should be dropdown with pre-defined list
❌ **No smart defaults** - Should remember last payer
❌ **No quick presets** - "Coffee" → Food, 3 EUR, current payer
❌ **Category not sorted** - Should show most-used first
❌ **No "Add Another"** - Have to navigate back and forth
❌ **No camera shortcut** - Should have "Scan Instead" link

**Proposed Changes:**
```
Form Structure:
├─ Amount + Currency (combined, prominent)
├─ Category (sorted by frequency, with icons)
├─ Payer (dropdown: Áron, Katus, Both)
├─ Merchant (autocomplete from previous)
├─ Date (smart default: today, easy to change)
└─ Description (optional, small)

Bottom Actions:
├─ [Save & Add Another] (primary)
└─ [Save & Done] (secondary)
```

---

### AI Scan (/expenses/scan)

**Current Flow:**
✅ Upload/Camera buttons
✅ Processing state
✅ Pre-filled verification form
✅ Fallback to manual

**Missing:**
❌ **Photo guidelines** - What makes a good scan
❌ **Confidence indicators** - Which fields are uncertain
❌ **Retry mechanism** - Try different photo without losing data
❌ **Example photos** - Show what works
❌ **Progress feedback** - "Analyzing receipt... Extracting amount... Done"

**Proposed Enhancements:**
```
Before Upload:
├─ Tips: "Ensure receipt is flat, well-lit, text visible"
├─ Example: [Good photo] vs [Bad photo]
└─ Upload/Camera buttons

During Processing:
├─ Animated loader
├─ Step-by-step: Detecting → Reading → Extracting
└─ Progress: 70%

After Scan:
├─ Confidence badges: Amount ✓ High | Category ⚠️ Medium
├─ Highlighted low-confidence fields (yellow border)
├─ [Retry Scan] [Use Manual Entry]
```

---

### Analytics (/analytics)

**Current Elements:**
✅ Summary cards (total, currency breakdowns)
✅ Category breakdown (with budget)
✅ Transaction table (sortable)
✅ Budget overview

**Missing Critical Features:**
❌ **Payer analysis** - Who paid how much, settlement needed
❌ **Date range filter** - View last week, this month, etc.
❌ **Search** - Find specific merchant or amount
❌ **Export** - CSV/PDF download
❌ **Visual charts** - Pie chart (categories), line chart (daily spending)
❌ **Expense actions** - Edit/Delete from table
❌ **Comparison** - This trip vs previous trips

**UX Issues:**
⚠️ Transaction table - No edit/delete actions on rows
⚠️ Sorting - No visual indicator of sorted column
⚠️ Mobile view - Table not responsive (needs card view)

**Proposed Additions:**
```
Analytics Sections:
├─ Filters Bar: [Date Range] [Category] [Payer] [Search]
├─ Key Metrics Row:
│  ├─ Total Spent
│  ├─ Daily Average
│  ├─ Áron Paid: X | Katus Paid: Y
│  └─ Settlement: Z
├─ Visual Charts:
│  ├─ Category Pie Chart
│  └─ Daily Spending Line Chart
├─ Category Breakdown (current)
├─ Transaction Table (with row actions):
│  └─ Each row: [...data] [Edit] [Delete]
└─ Export: [CSV] [PDF]
```

---

### Settings (/settings)

**Current Features:**
✅ Trip name, dates, budget
✅ Exchange rates (with warning)
✅ Category view

**Missing:**
❌ **Payer management** - Add/remove/edit payers
❌ **Category management** - Add/edit/delete categories
❌ **Category budgets** - Set per-category caps
❌ **Trip deletion** - Archive or permanently delete
❌ **Default settings** - Default payer, currency
❌ **Data export** - Backup trip data

**Critical Gap: Payers**
Currently, payer is free text in expense form. This causes:
- Inconsistent naming ("Áron" vs "Aron" vs "A")
- No analytics by payer
- No settlement calculations

**Proposed Payer Management:**
```
Settings → Payers Section:
├─ Áron (default: ✓)
├─ Katus
├─ [+ Add Payer]

For each payer:
├─ Name
├─ Default: Yes/No
└─ Total paid: X HUF (Y expenses)
```

---

### Trips Page (/trips)

**Current:**
✅ List trips
✅ Create new
✅ Click to switch

**Missing:**
❌ **Trip stats in list** - Show total spent, expense count
❌ **Trip status** - Active, Completed, Archived
❌ **Sorting** - By date, by total spent
❌ **Delete trip** - From list view
❌ **Archive trip** - Mark as complete
❌ **Trip comparison** - Side-by-side stats

**Proposed Trip Card:**
```
┌─────────────────────────────────┐
│ Croatia 2024          [⋮ Menu] │
│ Aug 15-25, 2024                 │
│                                 │
│ 604,505 HUF / 800,000 HUF      │
│ ████████░░ 75% used            │
│                                 │
│ 47 expenses • 3 categories     │
│ Status: Completed               │
└─────────────────────────────────┘
```

---

## 🧭 Navigation Audit

### Current Navigation Structure

**Mobile (Bottom Nav):**
- Home (Dashboard)
- Add (Manual Entry)
- Analytics
- Settings

**Desktop (Header):**
- TripLedger logo → Dashboard
- Trip Selector
- Trips link (mobile only)

**Issues:**
❌ **"Add" leads to manual entry only** - No quick access to scan
❌ **Settings in bottom nav** - Used infrequently, wastes prime space
❌ **No "All Trips" in desktop nav**
❌ **Inconsistent navigation** - Mobile has 4 tabs, desktop has different structure
⚠️ **Deep nesting** - Scan is under Add, not visible

**Proposed Navigation:**

**Mobile Bottom Nav:**
```
[🏠 Home] [📷 Scan] [📊 Stats] [⚙️ More]
```
- Home: Dashboard
- Scan: Direct to receipt scanner (80% use case)
- Stats: Analytics
- More: Settings, Trips, Export

**Desktop Header:**
```
TripLedger | [Trip Selector ▾] | Analytics | Settings | Trips
```

**Floating Action:**
- Mobile: [+ Quick Add] (minimal form)
- Desktop: Hidden (use header navigation)

---

## 🚨 Critical Usability Issues

### 1. Payer Management (CRITICAL)
**Problem:** Free-text payer field leads to:
- Inconsistent data ("Áron" vs "Aron")
- No payer analytics
- No settlement calculation

**Solution:**
- Add Payer model to database
- Settings page: Manage payers
- Expense form: Dropdown with payers
- Analytics: Show payer breakdown

**Priority:** 🔴 HIGH

---

### 2. Empty States (CRITICAL)
**Problem:** New user sees errors/confusion

**Missing Empty States:**
- No trips → Welcome screen
- No expenses → "Add your first expense"
- No budget set → "Set a budget to track progress"
- Category has no expenses → Don't show in analytics

**Solution:** Add empty state components for each scenario

**Priority:** 🔴 HIGH

---

### 3. Expense Actions (HIGH)
**Problem:** Can't edit or delete expenses after creation

**Solution:**
- Add Edit Expense page (/expenses/[id]/edit)
- Add Delete confirmation dialog
- Add row actions in transaction table
- Add expense detail view (click card)

**Priority:** 🟠 HIGH

---

### 4. Smart Defaults (MEDIUM)
**Problem:** Every expense requires full data entry

**Solution:**
- Remember last payer (localStorage)
- Default category to most-used
- Remember merchant names (autocomplete)
- Pre-fill time to current time

**Priority:** 🟡 MEDIUM

---

### 5. Settlement Calculation (HIGH)
**Problem:** Core use case (settling with Katus) requires manual calculation

**Solution:**
Add to Analytics page:
```
💰 Settlement
├─ Áron paid: 450,000 HUF (27 expenses)
├─ Katus paid: 350,000 HUF (20 expenses)
├─ Total: 800,000 HUF
└─ Settlement: Katus owes Áron 50,000 HUF
```

**Priority:** 🟠 HIGH

---

## 📋 Feature Completeness Checklist

### Core Features
- ✅ Multi-trip management
- ✅ Multi-currency support
- ✅ Fixed exchange rates
- ✅ Manual expense entry
- ✅ AI receipt scanning
- ✅ Budget tracking
- ✅ Category breakdown
- ✅ Transaction history
- ❌ **Payer management**
- ❌ **Settlement calculation**
- ❌ **Expense editing**
- ❌ **Expense deletion**

### User Experience
- ❌ **Empty states**
- ❌ **Onboarding flow**
- ❌ **Smart defaults**
- ⚠️ **Quick actions** (partial)
- ❌ **Autocomplete**
- ❌ **Recent selections**
- ❌ **Keyboard shortcuts**

### Analytics
- ✅ Category breakdown
- ✅ Transaction table
- ✅ Budget vs Actual
- ❌ **Payer analysis**
- ❌ **Date filtering**
- ❌ **Search**
- ❌ **Export (CSV/PDF)**
- ❌ **Visual charts**
- ❌ **Trip comparison**

### Mobile UX
- ✅ Bottom navigation
- ✅ Touch-friendly buttons
- ✅ Mobile FAB
- ⚠️ **Quick add flow** (too slow)
- ❌ **Offline support**
- ❌ **Pull to refresh**
- ❌ **Swipe actions**

---

## 🎯 Recommended Priorities

### Phase 1: Critical Fixes (Before First Use)
1. ✅ Empty states for no trips/expenses
2. ✅ Payer management system
3. ✅ Expense edit/delete functionality
4. ✅ Settlement calculation
5. ✅ Smart defaults (last payer, today's date)

### Phase 2: Core UX Improvements
6. ⚠️ Quick add modal (faster expense entry)
7. ⚠️ Merchant autocomplete
8. ⚠️ Category sorting by frequency
9. ⚠️ Receipt scan improvements
10. ⚠️ Transaction table row actions

### Phase 3: Analytics Enhancements
11. ⚠️ Payer breakdown in analytics
12. ⚠️ Date range filtering
13. ⚠️ Search functionality
14. ⚠️ CSV export
15. ⚠️ Visual charts (pie, line)

### Phase 4: Polish
16. ◯ Keyboard shortcuts
17. ◯ Offline support
18. ◯ PDF export with branding
19. ◯ Trip comparison
20. ◯ Spending predictions

---

## 🏆 Quick Wins (High Impact, Low Effort)

1. **Add empty states** → 30 min
   Impact: Prevents user confusion

2. **Default date to today** → 5 min
   Impact: Saves time on every expense

3. **Sort categories by usage** → 15 min
   Impact: Faster category selection

4. **Add "Add Another" button** → 10 min
   Impact: Speeds up bulk entry

5. **Show payer in expense card** → 5 min
   Impact: Better expense visibility

6. **Color-code budget progress** → 10 min
   Impact: Instant visual feedback

7. **Add row actions to table** → 20 min
   Impact: Easier expense management

---

## 📐 Information Architecture

### Current IA:
```
/
├─ /dashboard (trip required)
├─ /trips (list & create)
├─ /expenses
│  ├─ /new (manual)
│  └─ /scan (AI)
├─ /analytics (trip required)
└─ /settings (trip required)
```

**Issues:**
- Dashboard is root, but requires trip → Error for new users
- No /expenses/[id] for viewing/editing
- No /trips/[id] for trip details
- Settings is top-level, but trip-specific

**Proposed IA:**
```
/
├─ / (welcome or redirect)
├─ /trips (list all)
│  └─ /[id] (trip dashboard)
│     ├─ /expenses
│     │  ├─ /new
│     │  ├─ /scan
│     │  └─ /[expenseId]
│     ├─ /analytics
│     └─ /settings
└─ /onboarding (first-time)
```

This makes trip context explicit in URL.

---

## 🔚 Summary & Action Plan

### Critical Gaps Identified:
1. 🔴 **No payer management** → Can't calculate settlements
2. 🔴 **No empty states** → Broken first-time experience
3. 🔴 **No expense editing** → Can't fix mistakes
4. 🟠 **Slow quick entry** → Takes 60s instead of 15s
5. 🟠 **No settlement calc** → Core use case unsolved

### Recommended Immediate Actions:
1. **Add Payer system** (model + UI)
2. **Create empty state components**
3. **Build expense edit flow**
4. **Add settlement calculator**
5. **Implement smart defaults**

### Success Metrics:
- **Time to add expense:** < 20 seconds
- **New user to first expense:** < 3 minutes
- **Settlement calculation:** Automated, visible
- **Error rate:** < 5% (from payer typos)

---

**Overall Assessment: 7/10**
- ✅ Core functionality works
- ✅ Well-architected codebase
- ⚠️ Missing key UX refinements
- ❌ First-time user experience needs work

**With fixes: 9/10** (Production-ready)
