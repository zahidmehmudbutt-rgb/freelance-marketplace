/**
 * Idempotent demo-data updater — run safely any number of times.
 *
 * What it does:
 *   - Sets avatar_url for the 5 demo sellers + buyer (looked up by email)
 *   - Sets thumbnail_url for each demo gig (matched by exact title)
 *
 * What it does NOT do:
 *   - Create users, profiles, gigs, or packages — nothing is inserted
 *   - Touch any rows that aren't from the seed
 *
 * Run with: npm run update-demo
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE || SUPABASE_URL.includes("placeholder")) {
  console.error("✗ Missing or placeholder Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { autoRefreshToken: false, persistSession: false } });

const AVATARS: Array<{ email: string; avatar_url: string }> = [
  { email: "liam@brellis.test", avatar_url: "/avatars/liam.png" },
  { email: "chloe@brellis.test", avatar_url: "/avatars/chloe.jpeg" },
  { email: "mia@brellis.test", avatar_url: "/avatars/mia.png" },
  { email: "ethan@brellis.test", avatar_url: "/avatars/ethan.png" },
  { email: "jack@brellis.test", avatar_url: "/avatars/jack.png" },
  { email: "buyer@brellis.test", avatar_url: "/avatars/buyer.png" },
];

const unsplash = (id: string) =>
  `https://images.unsplash.com/${id}?w=800&h=480&q=80&auto=format&fit=crop`;

const GIG_THUMBS: Array<{ title: string; thumb: string }> = [
  { title: "I will build a professional Bubble.io web app or MVP",       thumb: unsplash("photo-1551288049-bebda4e38f71") },
  { title: "I will create a full-stack Next.js web application",         thumb: unsplash("photo-1555066931-4365d14bab8c") },
  { title: "I will create a React Native mobile app for iOS and Android", thumb: unsplash("photo-1512941937669-90a1b58e7e9c") },
  { title: "I will build a Flutter cross-platform mobile app",            thumb: unsplash("photo-1611078489935-0cb964de46d6") },
  { title: "I will design a modern UI/UX for your web or mobile app",     thumb: unsplash("photo-1559028012-481c04fa702d") },
  { title: "I will create a stunning logo and brand identity",            thumb: unsplash("photo-1626785774573-4b799315345d") },
  { title: "I will integrate OpenAI ChatGPT into your application",       thumb: unsplash("photo-1677442136019-21780ecad995") },
  { title: "I will build a custom AI chatbot for your business",          thumb: unsplash("photo-1620712943543-bcc4688e7485") },
  { title: "I will build your Bubble.io MVP in 14 days",                  thumb: unsplash("photo-1559136555-9303baea8ebd") },
  { title: "I will design and build a Webflow website",                   thumb: unsplash("photo-1467232004584-a241de8bcf5d") },
];

async function main() {
  console.log("🔄 Updating demo data...\n");

  let avatarsUpdated = 0;
  for (const a of AVATARS) {
    const { data, error } = await sb
      .from("users")
      .update({ avatar_url: a.avatar_url })
      .eq("email", a.email)
      .select("id");

    if (error) {
      console.warn(`  ✗ ${a.email} — ${error.message}`);
    } else if (!data || data.length === 0) {
      console.log(`  – ${a.email} — no matching user (skipped)`);
    } else {
      console.log(`  ✓ ${a.email} → ${a.avatar_url}`);
      avatarsUpdated++;
    }
  }
  console.log(`\nAvatars: ${avatarsUpdated}/${AVATARS.length} updated.\n`);

  let thumbsUpdated = 0;
  for (const g of GIG_THUMBS) {
    const { data, error } = await sb
      .from("gigs")
      .update({ thumbnail_url: g.thumb })
      .eq("title", g.title)
      .select("id");

    if (error) {
      console.warn(`  ✗ ${g.title.slice(0, 50)}... — ${error.message}`);
    } else if (!data || data.length === 0) {
      console.log(`  – ${g.title.slice(0, 50)}... — no matching gig (skipped)`);
    } else {
      console.log(`  ✓ ${g.title.slice(0, 50)}...  (${data.length} row${data.length === 1 ? "" : "s"})`);
      thumbsUpdated += data.length;
    }
  }
  console.log(`\nGig thumbnails: ${thumbsUpdated} row(s) updated.`);

  console.log("\n✅ Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
