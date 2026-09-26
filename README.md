# Harsh Apex Smart Business Suite

**Commercial Multi-Tenant SaaS Platform for Small & Medium Businesses**  
**Brand:** Harsh Apex Digital Solutions  
**Official Website:** [https://www.harshapex.com.lk](https://www.harshapex.com.lk)  
**Demo Domain:** [https://demo.harshapex.com.lk](https://demo.harshapex.com.lk)  
**GitHub Repository:** [https://github.com/raveenn10-bit/Harsh-Apex-Smart-Business-Suite.git](https://github.com/raveenn10-bit/Harsh-Apex-Smart-Business-Suite.git)

---

## 📖 Overview

**Harsh Apex Smart Business Suite** is an enterprise-grade, multi-tenant cloud application engineered to streamline end-to-end retail, distribution, and commercial business operations.

It is built as **ONE single codebase, ONE database architecture, ONE deployment, and ONE universal login interface**, serving three distinct subscription tiers:

1. **BASIC** (Starter Retail & POS Counter)
2. **BUSINESS** (Growth Retail, CRM, Quotations, Expenses, Staff & WhatsApp)
3. **PREMIUM** (Enterprise Multi-Branch, AI Business Intelligence, HR Kiosk & Web Sync)

The tier loaded after authentication is **strictly determined from the tenant's database record** (`businesses.package_id`), never inferred from email strings.

---

## 🛠️ Technology Stack

- **Framework:** Next.js 15 (App Router with React 19 & Turbopack)
- **Language:** TypeScript 5 (Strict Mode)
- **Styling & UI:** Tailwind CSS, shadcn/ui design tokens, Lucide Icons
- **Database Engine:** PostgreSQL with Supabase SSR Client & WASM PGlite hybrid engine
- **Authentication:** Supabase Auth & JWT cookie sessions with SSR middleware refresh
- **Data Validation:** Zod & Typed Database Interfaces
- **Visual Analytics:** Recharts & Canvas Renderers

---

## 👥 Demo Accounts & Isolated Workspaces

Every demo account operates in its own completely isolated `business_id` workspace with strict Row-Level Security:

| Account Email | Password | Package Tier | Demo Workspace Name |
|---|---|---|---|
| `basic1@demo.harshapex.com.lk` | `Demo@12345` | **BASIC** | Apex Mart Colombo (`demo-basic-01`) |
| `basic2@demo.harshapex.com.lk` | `Demo@12345` | **BASIC** | Apex Express Kandy (`demo-basic-02`) |
| `business1@demo.harshapex.com.lk` | `Demo@12345` | **BUSINESS** | Harsh Apex Tech Galle (`demo-business-01`) |
| `business2@demo.harshapex.com.lk` | `Demo@12345` | **BUSINESS** | Apex Logistics Negombo (`demo-business-02`) |
| `premium1@demo.harshapex.com.lk` | `Demo@12345` | **PREMIUM** | Apex Enterprise Holdings (`demo-premium-01`) |
| `premium2@demo.harshapex.com.lk` | `Demo@12345` | **PREMIUM** | Apex Global Industrial (`demo-premium-02`) |

---

## 🚀 Key Modules & Capabilities

1. **Point of Sale (POS & Billing)**
   - Barcode scanning & instant catalog lookup
   - Quantity increments, discounts, and multiple tenders (Cash, Card, Bank Transfer)
   - Multi-table atomic checkout: generates order, invoice, deducts physical stock, writes stock movement audit logs, updates customer lifetime purchase records, and triggers WhatsApp dispatch.
   - Official thermal receipt printable layout.

2. **Catalog & Inventory Warehouse**
   - Cost price vs selling price tracking, SKU codes, and barcodes
   - Minimum safety stock thresholds with automated low-stock warnings
   - Stock adjustments with full audit logs (`STOCK_IN`, `STOCK_OUT`, `ADJUSTMENT`).

3. **Quotations & Estimates**
   - Line items proposal builder with validity periods and discounts
   - **1-Click Convert to Invoice**: Instantly converts accepted estimates into commercial tax invoices.

4. **Expenses & P&L Finance**
   - Overhead tracking by category (Rent, Utilities, Salaries, Supplies)
   - Step-by-step Income Statement (P&L Waterfall): `Gross Sales` - `COGS` = `Gross Profit` - `Operating Expenses` = `Net Profit`
   - Reconciled cash collections vs outstanding credit balances.

5. **Client Relationship Management (CRM)**
   - Customer loyalty tiers: `VIP`, `Regular`, `New Lead`
   - Customer conversation logs and notes timeline
   - 1-Tap direct WhatsApp and phone call triggers.

6. **Staff & Advanced HR**
   - Employee directory with salary records and role assignments (`CASHIER`, `MANAGER`, `STAFF`, `ADMIN`)
   - Digital shift punch terminal for employee clock-in and clock-out
   - Daily attendance register and staff leave approval workflows.

7. **WhatsApp Business Simulator**
   - Interactive mobile phone mockup rendering authentic WhatsApp green chat bubbles and double blue checkmarks (✓✓)
   - Dispatches order receipts, invoice due alerts, payment receipts, and marketing blasts.

8. **Harsh Apex AI Business Intelligence Advisor**
   - Natural language intelligence engine answering questions using live tenant database numbers
   - Analyzes daily sales, low stock alerts, best sellers, and provides Sri Lankan retail strategy recommendations.

9. **Omni-Channel Web Storefront Sync**
   - 2-Way stock shield preventing online vs in-store overselling
   - Live catalog sync triggers and webhook activity logs.

10. **Commercial Packages & Super Admin Console**
    - Public pricing matrix comparing Basic, Business, and Premium
    - Inbound consultation request modal saving leads to database
    - Multi-tenant control console showing platform GMV, tenant metrics, and 1-click isolated demo resets.

---

## 💻 Local Development Setup

### 1. Prerequisites
- Node.js 18+ or 20+
- npm or pnpm

### 2. Installation
```bash
git clone https://github.com/raveenn10-bit/Harsh-Apex-Smart-Business-Suite.git
cd Harsh-Apex-Smart-Business-Suite
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Configure your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key_here
```

### 4. Running the Development Server
```bash
npm run dev -- -p 3000
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Verification

Run the automated test suites:
```bash
# 1. Verify Phase 1 database schema, multi-tenancy & tier gates (33/33 tests)
npm run test:phase1

# 2. Verify live HTTP authentication for all 6 demo accounts
npm run test:auth

# 3. Verify TypeScript strict type compilation
npx tsc --noEmit

# 4. Run Next.js production build (52/52 routes)
npm run build
```

---

## 🔒 Production Security Checklist

- [x] Strict tenant isolation via `business_id` scoping in every SQL query
- [x] Zero plain-text passwords stored in frontend code
- [x] Package tier feature gating validated server-side (`hasFeature()` helper)
- [x] SSR session validation in Next.js middleware
- [x] File upload validation (MIME types, 5MB limits, isolated storage directories)
- [x] Sensitive environment variables excluded via `.gitignore`
- [x] Super Admin console restricted from regular tenant accounts

---

## 🌐 Deployment to Vercel

1. Push your repository to GitHub.
2. Import the repository in [Vercel](https://vercel.com).
3. Set the environment variables in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Deploy!
5. In Domains settings, add custom domain `demo.harshapex.com.lk` and configure CNAME to `cname.vercel-dns.com`.

---

© 2026 **Harsh Apex Digital Solutions** ([www.harshapex.com.lk](https://www.harshapex.com.lk)). All rights reserved.
