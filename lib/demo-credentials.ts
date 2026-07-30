/**
 * Demo accounts created by scripts/seed.ts, surfaced on the login screen.
 *
 * These are seeded demonstration logins for the public demo deployment and hold
 * no real data. Keep this in sync with scripts/seed.ts — it is the same set of
 * accounts, and the seed file is the source of truth for what actually exists.
 */

export interface DemoAccount {
  role: string;
  email: string;
  password: string;
  blurb: string;
}

export const DEMO_PASSWORD = "Test1234!";

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: "Buyer",
    email: "buyer@brellis.test",
    password: DEMO_PASSWORD,
    blurb: "Browse gigs, order, and message sellers",
  },
  {
    role: "Seller",
    email: "liam@brellis.test",
    password: DEMO_PASSWORD,
    blurb: "Manage gigs, orders, and earnings",
  },
  {
    role: "Admin",
    email: "admin@brellis.test",
    password: DEMO_PASSWORD,
    blurb: "Moderate listings and review the platform",
  },
];
