# Brellis — Freelance Services Marketplace

A production-grade freelance marketplace portfolio project. Browse services, place orders, message sellers, leave reviews, withdraw earnings — all running on a free-tier stack with no real charges.

> **Portfolio mode**: Stripe in **test mode**, **mock** Stripe Connect, **mock** email system that logs to a Supabase table. Functionally complete and visually convincing without real money.

## Features
- Full-text search across gigs, category/price/delivery filters
- Gig detail with Basic/Standard/Premium packages + extras
- Checkout via Stripe test mode with transparent fee breakdown
- Order lifecycle: requirements → in progress → delivered → revision/accept → completed
- Real-time messaging (Supabase Realtime) with interactive custom offer cards
- Seller dashboard: earnings chart, level progress, analytics, 5-step gig wizard
- Admin: gig approvals, dispute resolution, reports, mock email inbox
- Vercel Cron: auto-complete orders, clear funds, update seller levels

## Tech Stack
Next.js 14 App Router + TypeScript strict, Tailwind, Radix UI, Supabase (DB/Auth/Storage/Realtime), Stripe test mode, RHF+Zod, Zustand, Framer Motion, TipTap, Recharts, Lucide, date-fns. Deploy on Vercel.

## Quick Start

### 1. Install
```bash
npm install
```

### 2. Supabase
1. [supabase.com](https://supabase.com) → New project
2. SQL Editor → paste `supabase/schema.sql` → Run
3. Storage → create buckets: `avatars`, `gig-media`, `portfolio` (public) and `order-files` (private)
4. Authentication → Providers → enable Email/Password
5. Copy URL + anon key + service_role key from Settings → API

### 3. Stripe (test mode)
1. [dashboard.stripe.com](https://dashboard.stripe.com) → Test mode
2. Copy publishable + secret keys from API keys
3. Webhook (optional): `stripe listen --forward-to localhost:3000/api/payments/webhook`

### 4. Env Vars
```bash
cp .env.example .env.local
# fill in real values
```

### 5. Seed
```bash
npm run seed
```

### 6. Run
```bash
npm run dev
```

## Test Credentials (after seeding)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@brellis.test` | `Test1234!` |
| Seller | `ahmad@brellis.test` | `Test1234!` |
| Buyer | `buyer@brellis.test` | `Test1234!` |

Test card: `4242 4242 4242 4242`, any future expiry, any CVC.

## Deploy to Vercel
1. Push to GitHub
2. [vercel.com](https://vercel.com) → Import Project → select repo
3. Add env vars in Vercel dashboard
4. Update `NEXT_PUBLIC_APP_URL` to your Vercel URL
5. Deploy — `vercel.json` auto-configures crons

## Fee Structure
- Seller: 20% commission per order
- Buyer: 5.5% service fee + $2.50 flat fee on orders under $50
- Tips: platform 20%, seller 80%

All in `platform_settings` table — never hardcoded.

See **MANUAL_SETUP.md** for step-by-step setup.

## License
MIT — portfolio use.
