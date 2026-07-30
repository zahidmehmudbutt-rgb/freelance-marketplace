/**
 * Seed script — run once with `npm run seed` after running supabase/schema.sql.
 *
 * Creates:
 *   - 1 admin user        (admin@brellis.test)
 *   - 5 seller users with profiles
 *   - 1 buyer user
 *   - 10 sample gigs with 3 packages each
 *   - A few sample reviews
 *
 * Password for all accounts: Test1234!
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { slugify } from "../lib/utils/slug-generator";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE || SUPABASE_URL.includes("placeholder")) {
  console.error("✗ Missing or placeholder Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { autoRefreshToken: false, persistSession: false } });

const PASSWORD = "Test1234!";

// Avatars: licensed photos provided by the project owner, stored in
// public/avatars/ and served as static assets from the same origin.
const SELLERS = [
  {
    email: "liam@brellis.test", username: "liamdev", full_name: "Liam Bennett",
    avatar_url: "/avatars/liam.png",
    tagline: "Full-Stack Web & Mobile Developer | 5+ Years Experience",
    skills: ["React", "Node.js", "Bubble.io", "Next.js", "React Native"],
    seller_level: "top_rated", total_orders_completed: 147, average_rating: 4.9, total_earnings_lifetime: 23400.0,
  },
  {
    email: "chloe@brellis.test", username: "chloedesigns", full_name: "Chloe Harper",
    avatar_url: "/avatars/chloe.jpeg",
    tagline: "UI/UX Designer & Brand Identity Specialist",
    skills: ["Figma", "Adobe XD", "Illustrator", "Brand Design"],
    seller_level: "level_two", total_orders_completed: 89, average_rating: 4.8, total_earnings_lifetime: 8900.0,
  },
  {
    email: "mia@brellis.test", username: "nocodemia", full_name: "Mia Sullivan",
    avatar_url: "/avatars/mia.png",
    tagline: "Bubble.io & Webflow Expert | MVP Builder",
    skills: ["Bubble.io", "Webflow", "No-Code", "Airtable", "Zapier"],
    seller_level: "level_one", total_orders_completed: 34, average_rating: 4.7, total_earnings_lifetime: 3200.0,
  },
  {
    email: "ethan@brellis.test", username: "aibuilder_ethan", full_name: "Ethan Whitfield",
    avatar_url: "/avatars/ethan.png",
    tagline: "AI Integration & Automation Specialist",
    skills: ["OpenAI API", "Python", "n8n", "Make.com", "ChatGPT"],
    seller_level: "level_one", total_orders_completed: 28, average_rating: 4.6, total_earnings_lifetime: 2800.0,
  },
  {
    email: "jack@brellis.test", username: "mobilemaster_jack", full_name: "Jack Thompson",
    avatar_url: "/avatars/jack.png",
    tagline: "React Native & Flutter Developer | 100+ Apps Built",
    skills: ["React Native", "Flutter", "Firebase", "iOS", "Android"],
    seller_level: "level_two", total_orders_completed: 63, average_rating: 4.8, total_earnings_lifetime: 11200.0,
  },
];

// Gig thumbnails: Unsplash photos matched to the service being sold. These
// show the WORK, not the seller's face. URLs use the Unsplash CDN with size
// + auto-format + crop parameters for consistent rendering at 5:3 aspect.
const unsplash = (id: string) =>
  `https://images.unsplash.com/${id}?w=800&h=480&q=80&auto=format&fit=crop`;

const GIGS = [
  { seller: "liamdev", category: "11111111-1111-1111-1111-111111111111", title: "I will build a professional Bubble.io web app or MVP", prices: [150, 350, 600],
    thumb: unsplash("photo-1551288049-bebda4e38f71") /* dashboard on laptop */ },
  { seller: "liamdev", category: "11111111-1111-1111-1111-111111111111", title: "I will create a full-stack Next.js web application", prices: [200, 450, 800],
    thumb: unsplash("photo-1555066931-4365d14bab8c") /* code editor */ },
  { seller: "mobilemaster_jack", category: "22222222-2222-2222-2222-222222222222", title: "I will create a React Native mobile app for iOS and Android", prices: [200, 500, 900],
    thumb: unsplash("photo-1512941937669-90a1b58e7e9c") /* phone in hand */ },
  { seller: "mobilemaster_jack", category: "22222222-2222-2222-2222-222222222222", title: "I will build a Flutter cross-platform mobile app", prices: [250, 550, 950],
    thumb: unsplash("photo-1611078489935-0cb964de46d6") /* mobile mockups */ },
  { seller: "chloedesigns", category: "33333333-3333-3333-3333-333333333333", title: "I will design a modern UI/UX for your web or mobile app", prices: [75, 150, 300],
    thumb: unsplash("photo-1559028012-481c04fa702d") /* Figma-style UI */ },
  { seller: "chloedesigns", category: "33333333-3333-3333-3333-333333333333", title: "I will create a stunning logo and brand identity", prices: [50, 120, 250],
    thumb: unsplash("photo-1626785774573-4b799315345d") /* branding mockup */ },
  { seller: "aibuilder_ethan", category: "44444444-4444-4444-4444-444444444444", title: "I will integrate OpenAI ChatGPT into your application", prices: [100, 250, 450],
    thumb: unsplash("photo-1677442136019-21780ecad995") /* AI / abstract */ },
  { seller: "aibuilder_ethan", category: "44444444-4444-4444-4444-444444444444", title: "I will build a custom AI chatbot for your business", prices: [150, 400, 700],
    thumb: unsplash("photo-1620712943543-bcc4688e7485") /* chatbot UI */ },
  { seller: "nocodemia", category: "11111111-1111-1111-1111-111111111111", title: "I will build your Bubble.io MVP in 14 days", prices: [200, 500, 1000],
    thumb: unsplash("photo-1559136555-9303baea8ebd") /* MVP sketch */ },
  { seller: "nocodemia", category: "11111111-1111-1111-1111-111111111111", title: "I will design and build a Webflow website", prices: [180, 400, 750],
    thumb: unsplash("photo-1467232004584-a241de8bcf5d") /* website on screen */ },
];

async function main() {
  console.log("🌱 Seeding Freelance Marketplace...");

  // Admin
  const adminEmail = "admin@brellis.test";
  console.log("Creating admin:", adminEmail);
  const { data: adminAuth, error: adminErr } = await sb.auth.admin.createUser({
    email: adminEmail,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: "Admin User", username: "admin" },
  });
  if (adminAuth?.user) {
    await sb.from("users").upsert({
      id: adminAuth.user.id,
      email: adminEmail,
      full_name: "Admin User",
      username: "admin",
      is_admin: true,
      is_email_verified: true,
    });
  } else if (adminErr) {
    console.warn("Admin:", adminErr.message);
  }

  // Sellers
  const sellerIds: Record<string, string> = {};
  for (const s of SELLERS) {
    console.log("Creating seller:", s.username);
    const { data: au, error } = await sb.auth.admin.createUser({
      email: s.email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: s.full_name, username: s.username },
    });
    if (error) {
      console.warn("  ", error.message);
      // Try to find existing
      const { data: existing } = await sb.from("users").select("id").eq("email", s.email).single();
      if (existing) sellerIds[s.username] = existing.id;
      continue;
    }
    if (au?.user) {
      sellerIds[s.username] = au.user.id;
      await sb.from("users").upsert({
        id: au.user.id,
        email: s.email,
        full_name: s.full_name,
        username: s.username,
        avatar_url: s.avatar_url,
        is_seller: true,
        is_email_verified: true,
      });
      await sb.from("seller_profiles").upsert({
        user_id: au.user.id,
        tagline: s.tagline,
        description: `${s.tagline}. With years of experience helping clients achieve their goals, I bring quality, communication, and reliability to every project.`,
        skills: s.skills,
        seller_level: s.seller_level,
        total_orders_completed: s.total_orders_completed,
        average_rating: s.average_rating,
        total_earnings_lifetime: s.total_earnings_lifetime,
        response_rate: 95,
        response_time_hours: 2,
        on_time_delivery_rate: 98,
        stripe_onboarding_complete: true,
        mock_bank_name: "HBL - Habib Bank Limited",
        mock_account_last4: "4242",
      });
    }
  }

  // Buyer
  console.log("Creating buyer");
  const { data: buyerAuth } = await sb.auth.admin.createUser({
    email: "buyer@brellis.test",
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: "Demo Buyer", username: "demo_buyer" },
  });
  if (buyerAuth?.user) {
    await sb.from("users").upsert({
      id: buyerAuth.user.id,
      email: "buyer@brellis.test",
      full_name: "Demo Buyer",
      username: "demo_buyer",
      avatar_url: "/avatars/buyer.png",
      is_email_verified: true,
    });
  }

  // Gigs
  for (const g of GIGS) {
    const sellerId = sellerIds[g.seller];
    if (!sellerId) {
      console.warn("Skipping gig — no seller id for", g.seller);
      continue;
    }
    const slug = slugify(g.title) + "-" + Math.random().toString(36).slice(2, 6);
    const { data: gig, error } = await sb.from("gigs").insert({
      seller_id: sellerId,
      category_id: g.category,
      title: g.title,
      slug,
      description: `<p>${g.title}. I bring years of experience and a track record of happy clients. Here's what you get:</p><ul><li>Clear communication throughout the project</li><li>Fast turnaround</li><li>Quality work that matches the brief</li><li>Free post-delivery support</li></ul>`,
      short_description: g.title.slice(0, 150),
      tags: g.title.split(" ").filter((w) => w.length > 3).slice(0, 5),
      thumbnail_url: g.thumb,
      status: "active",
      total_orders: Math.floor(Math.random() * 100),
      total_reviews: Math.floor(Math.random() * 80),
      average_rating: 4.5 + Math.random() * 0.5,
      published_at: new Date().toISOString(),
    }).select().single();

    if (error || !gig) {
      console.warn("  Gig error:", error?.message);
      continue;
    }
    const tiers = ["basic", "standard", "premium"] as const;
    for (let i = 0; i < 3; i++) {
      await sb.from("gig_packages").insert({
        gig_id: gig.id,
        package_type: tiers[i],
        name: ["Starter", "Standard", "Premium"][i],
        description: ["Basic package for simple needs", "Most popular — full service", "Complete solution with all features"][i],
        price: g.prices[i],
        delivery_days: [3, 7, 14][i],
        revisions: [1, 3, 5][i],
        features: [
          { name: "Source files", included: i >= 1 },
          { name: "Commercial use rights", included: i >= 2 },
          { name: "Priority support", included: i === 2 },
          { name: "Free revisions", included: true },
        ] as never,
      });
    }
    console.log("  ✓", g.title.slice(0, 60));
  }

  console.log("\n✅ Seed complete!");
  console.log("Test accounts (password: Test1234!):");
  console.log("  admin@brellis.test");
  console.log("  liam@brellis.test");
  console.log("  buyer@brellis.test");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
