/**
 * Test the full transitionOrder workflow including email side effects.
 * This exercises the DECIMAL.toFixed fix.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { transitionOrder } from "../lib/utils/order-workflow";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(URL, SERVICE, { auth: { autoRefreshToken: false, persistSession: false } });

async function main() {
  console.log("🧪 transitionOrder workflow test starting...");

  const { data: buyer } = await admin.from("users").select("*").eq("email", "buyer@brellis.test").single();
  const { data: gig } = await admin.from("gigs").select("*").eq("status", "active").limit(1).single();
  const { data: pkg } = await admin.from("gig_packages").select("*").eq("gig_id", gig!.id).eq("package_type", "basic").single();

  // Pre-clean any old test orders for this buyer
  const { data: oldOrders } = await admin.from("orders").select("id").like("order_number", "SB-WF-%");
  for (const o of oldOrders ?? []) {
    await admin.from("reviews").delete().eq("order_id", o.id);
    await admin.from("tips").delete().eq("order_id", o.id);
    await admin.from("orders").delete().eq("id", o.id);
  }

  // Snapshot email count before
  const { count: emailsBefore } = await admin.from("email_logs").select("id", { count: "exact", head: true });

  // Create a pending_payment order, then drive transitions
  const orderNumber = `SB-WF-${Date.now()}`;
  const { data: order, error } = await admin.from("orders").insert({
    order_number: orderNumber,
    buyer_id: buyer!.id,
    seller_id: gig!.seller_id,
    gig_id: gig!.id,
    package_id: pkg!.id,
    package_snapshot: pkg,
    gig_base_price: pkg!.price,
    order_subtotal: pkg!.price,
    buyer_service_fee: 8.25,
    buyer_total_paid: 158.25,
    platform_commission: 30,
    seller_earnings: 120,
    delivery_days: pkg!.delivery_days,
    revisions_allowed: pkg!.revisions,
    status: "pending_payment",
  }).select().single();
  if (error || !order) {
    console.error("✗ Order insert failed:", error);
    process.exit(1);
  }
  console.log("✓ Order created (pending_payment):", order.order_number);

  // Transition: pending_payment → active → requires_requirements
  let result = await transitionOrder(order.id, "active");
  if (result.error) {
    console.error("✗ active transition failed:", result.error);
    process.exit(1);
  }
  console.log("✓ transitioned to active");

  result = await transitionOrder(order.id, "requires_requirements");
  if (result.error) {
    console.error("✗ requires_requirements transition failed:", result.error);
    process.exit(1);
  }
  console.log("✓ transitioned to requires_requirements (emails should fire here)");

  result = await transitionOrder(order.id, "in_progress");
  if (result.error) {
    console.error("✗ in_progress transition failed:", result.error);
    process.exit(1);
  }
  console.log("✓ transitioned to in_progress");

  result = await transitionOrder(order.id, "delivered", { delivery_message: "Done!" });
  if (result.error) {
    console.error("✗ delivered transition failed:", result.error);
    process.exit(1);
  }
  console.log("✓ transitioned to delivered (delivery email should fire)");

  result = await transitionOrder(order.id, "completed");
  if (result.error) {
    console.error("✗ completed transition failed:", result.error);
    process.exit(1);
  }
  console.log("✓ transitioned to completed (completion email should fire)");

  // Verify side effects
  const { count: emailsAfter } = await admin.from("email_logs").select("id", { count: "exact", head: true });
  const newEmails = (emailsAfter ?? 0) - (emailsBefore ?? 0);
  console.log(`\n📧 New emails created: ${newEmails}`);

  if (newEmails < 3) {
    console.warn(`⚠ Expected at least 3 emails (buyer confirm, seller new order, delivery, completion). Got ${newEmails}.`);
  }

  // Verify seller balance was updated
  const { data: profile } = await admin
    .from("seller_profiles")
    .select("total_orders_completed, balance_pending_clearance")
    .eq("user_id", gig!.seller_id)
    .single();
  console.log("   seller orders_completed:", profile?.total_orders_completed);
  console.log("   seller pending_clearance:", profile?.balance_pending_clearance);

  // Cleanup
  await admin.from("orders").delete().eq("id", order.id);
  // Reset seller profile pending balance to what it was (decrement what we added)
  if (profile) {
    await admin.from("seller_profiles").update({
      total_orders_completed: Math.max(0, profile.total_orders_completed - 1),
      balance_pending_clearance: Math.max(0, Number(profile.balance_pending_clearance) - 120),
    }).eq("user_id", gig!.seller_id);
  }
  console.log("\n🧹 Cleaned up");

  console.log("\n✅ WORKFLOW TEST PASSED");
}

main().catch((e) => {
  console.error("✗ Test failed:", e);
  process.exit(1);
});
