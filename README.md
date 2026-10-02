# KukuTrack - Production Poultry Business Management Platform

A complete, production-grade poultry business management platform engineered for commercial poultry operations, hatcheries, and layer/broiler farms.

Built with **React, TypeScript, Vite, Tailwind CSS**, and powered by **Supabase (PostgreSQL, Authentication, Realtime subscriptions, and Row Level Security)**.

---

## 1. Architecture & Design Principles

- **Single Source of Truth**: All operational records, flock census, daily egg counts, brooding timelines, operational expenses, customer receivables, and financial ledgers originate strictly from your Supabase PostgreSQL database.
- **Zero Mock / Fake Data**: The application starts empty upon fresh database setup. No demo records or placeholder statistics.
- **Realtime Synchronization**: Instant data synchronization across desktop computers, tablets, and mobile devices via Supabase Realtime WebSocket channels.
- **Web + Android Unified Backend**: Modular service layer (`src/services/*`) allowing future Android applications (Kotlin/Jetpack Compose or React Native) to bind directly to the same Supabase authentication and database schema.
- **Bilingual Interface**: Full English and Swahili (Kiswahili) localization tailored for East African poultry enterprises.
- **Strict Row Level Security (RLS)**: Enforced directly at the PostgreSQL level.
- **Administrator Governance & Danger Zone**:
  - The **first user who signs up** automatically becomes the system **Administrator**.
  - All subsequent registrations default to **Staff** role.
  - Protected database reset via stored procedure (`reset_business_database`) requiring the explicit confirmation phrase `DELETE EVERYTHING`.

---

## 2. Core Modules

1. **Flock & Poultry Stock Management**:
   - Track Indigenous (Kienyeji), Crossbred (Chotara/Kuroiler/Sasso), Broiler (Nyama), Layer (Mayai), Duck (Bata), Turkey (Bata Mzinga), and custom breeds.
   - Initial acquisition, male/female distribution, young/adult birds, purchase costs, source supplier.
   - Automatic live stock formula: `Current Stock = Initial - Mortality - Sold`.
   - Mortality logger with causes and date audits.

2. **Egg Production & Utilization**:
   - Daily collection logs with active laying hens count.
   - Damaged/broken, spoiled, sold, and internally used (e.g. incubator/kitchen) egg tracking.
   - Automatic calculations: `Remaining Usable Eggs` and `Egg Sales Revenue`.

3. **Brooding & Incubation Management**:
   - Species-specific incubation duration defaults: **Chicken (21 days)** and **Duck (28 days)**, fully configurable.
   - Automatic calculation of `Expected Hatch Date`.
   - Hatch outcome logging: Hatched eggs, infertile/failed eggs, live chicks/ducklings produced, and batch hatch success rate (%).

4. **Farm & Feed Expenses**:
   - Standard categories: Feed, Vaccines, Medication, Labour, Transport, Housing, Equipment, Electricity, Water, Packaging, Poultry purchase, Repairs, and custom categories.
   - Stored in Tanzanian Shillings (**TZS**).
   - Receipt reference and staff accountability tracking.

5. **Sales & Customer Invoicing**:
   - Products: Live birds, Eggs, Day-old chicks, Ducklings, Manure, and custom products.
   - Automatic stock inventory deduction when Live Birds are sold.
   - Cash received vs. customer outstanding balances.

6. **Financials & Profitability**:
   - Gross Revenue, Stock Purchase Costs, Direct Operating Costs, Gross Profit, and Net Profit.
   - Cash flow realization and customer debt aging.
   - Monthly and yearly P&L ledger.

7. **Certified Excel Export**:
   - Real `.xlsx` workbooks generated with SheetJS (`xlsx`).
   - Exports for Poultry, Eggs, Sales, Expenses, Brooding, Financials, or Full Master multi-sheet report.
   - Date range filters: Daily, Weekly, Monthly, Yearly, and Custom Date Range.

8. **Admin Dashboard**:
   - User account status (Activate / Deactivate).
   - Role management (Promote to Admin / Demote to Staff).
   - System audit trail with user actions and timestamps.
   - Safe database wipe protected by confirmation phrase `DELETE EVERYTHING`.

---

## 3. Database Setup (Supabase)

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to your **Supabase Dashboard → SQL Editor**.
3. Open the file `supabase/schema.sql` from this repository, paste the entire SQL content into the SQL Editor, and click **Run**.
4. The migration script will:
   - Create all tables (`profiles`, `poultry_stock`, `poultry_movements`, `egg_production`, `brooding_records`, `expense_categories`, `expenses`, `customers`, `sales`, `activity_logs`, `business_settings`).
   - Create triggers for automatic stock calculation, egg balance calculation, and sale inventory deduction.
   - Create the `on_auth_user_created` trigger that promotes the first registered user to **admin**.
   - Create the `reset_business_database` RPC function.
   - Enable Row Level Security (RLS) policies on all tables.
   - Enable Supabase Realtime publication on all operational tables.

---

## 4. Environment Variables

Create a `.env` file (or add these to your Vercel project settings):

```env
# Frontend Supabase Configuration
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Optional server-side secret (Used strictly for server-side functions, never in client code)
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 5. Local Development Commands

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev

# 3. Build for production
npm run build

# 4. Preview the production build locally
npm run preview
```

---

## 6. Vercel Deployment Instructions

1. Push your repository to **GitHub**.
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository.
4. Vercel will automatically detect **Vite** as the framework preset:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Expand the **Environment Variables** section and add:
   - `VITE_SUPABASE_URL` = `<Your Supabase Project URL>`
   - `VITE_SUPABASE_ANON_KEY` = `<Your Supabase Public Anon Key>`
6. Click **Deploy**. Your application will be live in seconds.

---

## 7. Future Android Application Integration

Because KukuTrack isolates database and domain logic inside `src/services/`, connecting a native Android app requires zero changes to the database:
- **Android Supabase SDK**: Add `io.github.jan-tennert.supabase:postgrest-kt` and `gotrue-kt` to your Android `build.gradle.kts`.
- **Same Project URL & Anon Key**: Pass the same `SUPABASE_URL` and `SUPABASE_ANON_KEY` to the Android client.
- **Cross-Device Updates**: Any record entered on Android will instantly trigger the Supabase Realtime channel and update the Web dashboard in real time, and vice versa.
