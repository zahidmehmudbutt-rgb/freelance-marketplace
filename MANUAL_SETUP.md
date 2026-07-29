# Freelance Marketplace — Manual Setup Steps

The code is complete. You now need to wire up the external services. **Total time: ~20 minutes.**

---

## 1. Create a Supabase project (5 min)

1. Go to [supabase.com](https://supabase.com) → sign in
2. **New Project** — pick a name, region (closest to you), database password
3. Wait ~2 min for provisioning

### 1a. Run the schema
- Open **SQL Editor → New Query**
- Open `supabase/schema.sql` in this repo, copy the entire contents
- Paste into Supabase SQL Editor → click **Run**
- You should see "Success. No rows returned." or similar.

### 1b. Create Storage buckets
- Go to **Storage → New bucket**
- Create four buckets, each set to public except `order-files`:
  - `avatars` (public)
  - `gig-media` (public)
  - `portfolio` (public)
  - `order-files` (private)

### 1c. Enable Email/Password auth
- **Authentication → Providers → Email** → make sure "Enable email provider" is on
- Disable "Confirm email" for portfolio mode (or keep it; check the admin email inbox after signup to find the link)

### 1d. Get your API keys
- **Settings → API**
- Copy:
  - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
  - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ Keep this private

---

## 2. Create a Stripe test account (3 min)

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com) → sign up if needed
2. **Important**: top-left, make sure the **Test mode** toggle is ON
3. **Developers → API keys**:
   - Copy **Publishable key** (`pk_test_...`) → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Copy **Secret key** (`sk_test_...`) → `STRIPE_SECRET_KEY`
4. (Optional) Webhook locally: install [Stripe CLI](https://docs.stripe.com/stripe-cli) then run
   ```
   stripe listen --forward-to localhost:3000/api/payments/webhook
   ```
   Copy the `whsec_...` it prints → `STRIPE_WEBHOOK_SECRET`

---

## 3. Fill in `.env.local`

Open `.env.local` (already created with placeholders) and replace each value:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_EMAILS=admin@brellis.test
CRON_SECRET=any-long-random-string-here
```

---

## 4. Seed demo data (1 min)

After env vars are filled:

```bash
npm run seed
```

This creates:
- `admin@brellis.test` — full admin access
- 5 demo sellers with realistic profiles
- 1 buyer (`buyer@brellis.test`)
- 10 gigs across categories

Password for all: `Test1234!`

> **If seed fails:** Run `supabase/schema.sql` first. The seed expects all tables and the auto-create-user trigger to exist.

---

## 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Quick test path:
1. Browse the landing page — fee transparency, categories, gigs
2. Sign in as `buyer@brellis.test` → browse gigs → place an order
3. Use Stripe test card `4242 4242 4242 4242`, any future expiry, any CVC
4. Sign in as `ahmad@brellis.test` (seller) → see the order in seller dashboard → deliver it
5. Switch back to buyer → accept delivery → leave review + tip
6. Sign in as `admin@brellis.test` → check `/admin/emails` to see all the system emails

---

## 6. Deploy to Vercel (3 min — already mostly done)

### 6a. GitHub repo — already pushed
✅ Code is live at https://github.com/zahidmehmudbutt-rgb/freelance-marketplace (public)

### 6b. Import on Vercel (3 min, all browser)

1. Go to **https://vercel.com/new** (sign in with GitHub if not already)
2. Click **Import** next to **zahidmehmudbutt-rgb/freelance-marketplace**
3. Framework Preset: **Next.js** (auto-detected) — leave all defaults
4. Expand **Environment Variables** and **copy/paste them from your local `.env.local` file**. The keys you need to add (values are in `.env.local` — don't commit them):

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` ⚠️ secret — keep private
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (placeholder OK)
   - `STRIPE_SECRET_KEY` (placeholder OK)
   - `STRIPE_WEBHOOK_SECRET` (placeholder OK)
   - `NEXT_PUBLIC_APP_URL` — set to your Vercel URL (you'll update after first deploy)
   - `ADMIN_EMAILS` — `admin@brellis.test`
   - `CRON_SECRET` — generate a long random string (any value)

5. Click **Deploy** — build takes ~3 minutes
6. Once it shows "Your project has been deployed", copy your Vercel URL (e.g. `https://brellis-xxxx.vercel.app`)
7. Go to **Settings → Environment Variables** → edit `NEXT_PUBLIC_APP_URL` to your real Vercel URL → click **Redeploy**

⚠️ If your domain ends up different from `brellis.vercel.app`, step 7 ensures emails contain the right links.

### 6c. Cron jobs
`vercel.json` is in the repo — Vercel will discover the 4 cron jobs automatically:
- Auto-complete delivered orders after 3 days
- Clear funds after the clearing period
- Update seller levels nightly
- Expire stale custom offers

Verify in Vercel dashboard → **Settings → Cron Jobs** that all 4 are listed.

### 6d. Stripe webhook in production
1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**
2. URL: `https://your-app.vercel.app/api/payments/webhook`
3. Listen for `payment_intent.succeeded`, `charge.refunded`
4. Copy the new signing secret → add as `STRIPE_WEBHOOK_SECRET` env var in Vercel → redeploy

---

## What's mocked vs real

| Feature | Real | Mocked |
|---|---|---|
| Auth | ✅ Supabase Auth (real) | |
| Database | ✅ Supabase Postgres (real) | |
| File storage | ✅ Supabase Storage (real) | |
| Real-time messaging | ✅ Supabase Realtime (real) | |
| Payments | ✅ Stripe test mode (real flow, fake money) | |
| Webhooks | ✅ (if configured) | |
| Email | | ❌ Logged to `email_logs` table → visible at `/admin/emails` |
| Stripe Connect | | ❌ Mock bank form sets `stripe_onboarding_complete=true` |
| Withdrawals | | ❌ Logged in DB; no real bank transfer |
| Refunds (test mode) | ✅ Stripe test refunds work | |

---

## Troubleshooting

**"Invalid API key" / Supabase calls fail**
You didn't replace placeholders in `.env.local`. Open it and put real values.

**Seed script error: relation does not exist**
Run `supabase/schema.sql` first in the Supabase SQL Editor.

**Can't log in**
- Check Supabase → Authentication → Users — does the user exist?
- Check Supabase → SQL Editor: `select * from public.users where email = 'buyer@brellis.test'` — does the row exist?
- If the auth user exists but `public.users` row doesn't, the trigger didn't fire. Re-run `supabase/schema.sql`.

**Admin pages return 404**
Check `select is_admin from users where email = 'admin@brellis.test'`. Should be `true`. If not: `UPDATE users SET is_admin = true WHERE email = 'admin@brellis.test';`

**TypeScript errors after editing**
Run `npm run build` — they'll show. The schema's TypeScript types are hand-written in `types/database.types.ts`; if you add fields to a table in Supabase, update them here too (or run `npx supabase gen types typescript --linked > types/database.types.ts` after linking the project).

**Vercel cron jobs not firing**
Vercel cron is on the free plan but limited to 2 crons. If you need all 4, upgrade to Pro, or comment out crons you don't need in `vercel.json`.

---

## Test card numbers (Stripe test mode)

| Card | Purpose |
|---|---|
| `4242 4242 4242 4242` | Always succeeds |
| `4000 0000 0000 0002` | Always declines |
| `4000 0025 0000 3155` | Requires 3DS auth |

Any future expiry (e.g. `12/30`), any CVC (e.g. `123`), any ZIP.

---

## Files you'll likely want to customize

- `.env.local` — your secrets
- `app/page.tsx` — landing page hero text
- `app/layout.tsx` — site metadata, OG tags
- `tailwind.config.ts` — brand colors
- `supabase/schema.sql` — `platform_settings` seed for fee rates
- `lib/email/templates.ts` — email content
- `scripts/seed.ts` — demo data

---

Built as a portfolio project. Have fun.
