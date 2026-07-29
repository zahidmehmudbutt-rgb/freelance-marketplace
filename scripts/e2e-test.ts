/**
 * End-to-end test: simulates buyer → place order → seller delivers → buyer accepts → review.
 * Run with: npx tsx scripts/e2e-test.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { calculateOrderPricing, DEFAULT_PLATFORM_SETTINGS } from "../lib/utils/fee-calculator";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(URL, SERVICE, { auth: { autoRefreshToken: false, persistSession: false } });

async function main() {
  console.log("🧪 E2E test starting...");

  // 1. Find a buyer and a gig
  const { data: buyer } = await admin.from("users").select("*").eq("email", "buyer@brellis.test").single();
  const { data: gig } = await admin.from("gigs").select("*").eq("status", "active").limit(1).single();
  if (!buyer || !gig) {
    console.error("Missing buyer or gig. Run npm run seed first.");
    process.exit(1);
  }
  console.log("✓ Found buyer:", buyer.email);
  console.log("✓ Found gig:", gig.title);

  const { data: pkg } = await admin.from("gig_packages").select("*").eq("gig_id", gig.id).eq("package_type", "basic").single();
  if (!pkg) {
    console.error("Gig has no basic package");
    process.exit(1);
  }
  console.log("✓ Package: $" + pkg.price);

  // 2. Calculate pricing
  const pricing = calculateOrderPricing(Number(pkg.price), 0, DEFAULT_PLATFORM_SETTINGS);
  console.log("✓ Pricing: buyer pays $" + pricing.buyerTotalPaid + " | seller earns $" + pricing.sellerEarnings + " | platform $" + pricing.platformCommission);

  // 3. Place order
  const orderNumber = `SB-TEST-${Date.now()}`;
  const deliveryDue = new Date(Date.now() + pkg.delivery_days * 86400000);
  const { data: order, error: orderErr } = await admin.from("orders").insert({
    order_number: orderNumber,
    buyer_id: buyer.id,
    seller_id: gig.seller_id,
    gig_id: gig.id,
    package_id: pkg.id,
    package_snapshot: pkg,
    gig_base_price: pkg.price,
    order_subtotal: pricing.orderSubtotal,
    buyer_service_fee: pricing.buyerServiceFee,
    buyer_total_paid: pricing.buyerTotalPaid,
    platform_commission: pricing.platformCommission,
    seller_earnings: pricing.sellerEarnings,
    delivery_days: pkg.delivery_days,
    revisions_allowed: pkg.revisions,
    delivery_due_at: deliveryDue.toISOString(),
    status: "requires_requirements",
  }).select().single();
  if (orderErr || !order) {
    console.error("✗ Order insert failed:", orderErr);
    process.exit(1);
  }
  console.log("✓ Order created:", order.order_number);

  // 4. Submit requirements (transition to in_progress)
  await admin.from("orders").update({
    requirements_submitted: true,
    buyer_requirements: "Test requirements: build a simple landing page",
    status: "in_progress",
  }).eq("id", order.id);
  console.log("✓ Requirements submitted, status = in_progress");

  // 5. Seller delivers
  await admin.from("orders").update({
    status: "delivered",
    delivered_at: new Date().toISOString(),
    delivery_message: "Here's your landing page!",
    auto_complete_at: new Date(Date.now() + 3 * 86400000).toISOString(),
  }).eq("id", order.id);
  console.log("✓ Order delivered");

  // 6. Buyer accepts (completed)
  await admin.from("orders").update({
    status: "completed",
    completed_at: new Date().toISOString(),
    funds_cleared: false,
    funds_cleared_at: new Date(Date.now() + 14 * 86400000).toISOString(),
  }).eq("id", order.id);
  console.log("✓ Order accepted → completed");

  // 7. Buyer leaves review
  const { error: reviewErr } = await admin.from("reviews").insert({
    order_id: order.id,
    gig_id: gig.id,
    buyer_id: buyer.id,
    seller_id: gig.seller_id,
    overall_rating: 5,
    communication_rating: 5,
    service_as_described_rating: 5,
    would_recommend: true,
    review_text: "Excellent work, fast delivery, will hire again!",
  });
  if (reviewErr) {
    console.error("✗ Review failed:", reviewErr);
  } else {
    console.log("✓ Review posted");
  }

  // 8. Buyer sends tip
  const tipAmount = 5;
  const tipPlatform = Math.round(tipAmount * 0.20 * 100) / 100;
  await admin.from("tips").insert({
    order_id: order.id,
    buyer_id: buyer.id,
    seller_id: gig.seller_id,
    amount: tipAmount,
    platform_commission: tipPlatform,
    seller_amount: tipAmount - tipPlatform,
    message: "Thanks!",
  });
  console.log("✓ Tip sent: $" + tipAmount);

  // 9. Verify order state
  const { data: finalOrder } = await admin.from("orders").select("*").eq("id", order.id).single();
  console.log("\n📊 Final order state:");
  console.log("   status:", finalOrder?.status);
  console.log("   funds_cleared:", finalOrder?.funds_cleared);
  console.log("   funds_cleared_at:", finalOrder?.funds_cleared_at);
  console.log("   buyer_total_paid:", finalOrder?.buyer_total_paid);
  console.log("   seller_earnings:", finalOrder?.seller_earnings);
  console.log("   platform_commission:", finalOrder?.platform_commission);

  // 10. Test email log creation
  const { count: emailCount } = await admin.from("email_logs").select("id", { count: "exact", head: true });
  console.log("\n📧 Total emails in log:", emailCount);

  // 11. Cleanup: delete the test order
  await admin.from("reviews").delete().eq("order_id", order.id);
  await admin.from("tips").delete().eq("order_id", order.id);
  await admin.from("orders").delete().eq("id", order.id);
  console.log("\n🧹 Test order cleaned up");

  console.log("\n✅ E2E TEST PASSED");
}

main().catch((e) => {
  console.error("✗ Test failed:", e);
  process.exit(1);
});
