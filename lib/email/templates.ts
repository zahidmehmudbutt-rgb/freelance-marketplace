export type EmailTemplate =
  | "welcome"
  | "order_placed_buyer"
  | "new_order_seller"
  | "order_delivered"
  | "order_completed"
  | "gig_approved"
  | "gig_rejected"
  | "review_request"
  | "funds_cleared"
  | "withdrawal_processed"
  | "tip_received"
  | "password_reset"
  | "dispute_opened";

const wrapper = (heading: string, body: string) => `
<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#F9FAFB;font-family:'Inter',Arial,sans-serif;color:#111827;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#0D9488;padding:30px;border-radius:12px 12px 0 0;text-align:center;">
      <h1 style="color:#fff;margin:0;font-family:'Inter',Arial,sans-serif;font-size:24px;font-weight:600;letter-spacing:-0.01em;">${heading}</h1>
    </div>
    <div style="background:#fff;padding:32px;border-radius:0 0 12px 12px;border:1px solid #E5E7EB;border-top:none;">
      ${body}
    </div>
    <p style="text-align:center;color:#6B7280;font-size:12px;margin-top:24px;">© ${new Date().getFullYear()} Freelance Marketplace</p>
  </div>
</body></html>`;

const btn = (href: string, label: string, color = "#F97316") =>
  `<a href="${href}" style="display:inline-block;background:${color};color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px;">${label}</a>`;

const detailRow = (label: string, value: string) =>
  `<p style="margin:8px 0;color:#374151;"><strong style="color:#111827;">${label}:</strong> ${value}</p>`;

const detailBlock = (rows: string) =>
  `<div style="background:#F9FAFB;padding:20px;border-radius:8px;margin:20px 0;">${rows}</div>`;

export const templates: Record<EmailTemplate, (data: Record<string, string | number>) => string> = {
  welcome: (d) =>
    wrapper("Welcome to Freelance Marketplace! 👋", `
      <p>Hi ${d.userName},</p>
      <p>Welcome to Freelance Marketplace — the marketplace where you can find skilled freelancers or start selling your own services.</p>
      <p>Get started by browsing services or activating your seller profile.</p>
      ${btn(String(d.appUrl), "Explore Freelance Marketplace")}
    `),

  order_placed_buyer: (d) =>
    wrapper("Order Confirmed 🎉", `
      <p>Hi ${d.buyerName},</p>
      <p>Your order <strong>${d.orderNumber}</strong> has been placed.</p>
      ${detailBlock(
        detailRow("Service", String(d.gigTitle)) +
        detailRow("Seller", String(d.sellerName)) +
        detailRow("Amount paid", `$${d.totalPaid}`) +
        detailRow("Expected delivery", String(d.dueDate))
      )}
      ${btn(String(d.orderUrl), "View Order")}
    `),

  new_order_seller: (d) =>
    wrapper("New Order Received! 💼", `
      <p>Hi ${d.sellerName},</p>
      <p>You have a new order for <strong>${d.gigTitle}</strong>!</p>
      ${detailBlock(
        detailRow("Order", String(d.orderNumber)) +
        detailRow("Buyer", String(d.buyerName)) +
        detailRow("Your earnings", `$${d.sellerEarnings}`) +
        detailRow("Due", String(d.dueDate))
      )}
      ${btn(String(d.orderUrl), "View Order", "#0D9488")}
    `),

  order_delivered: (d) =>
    wrapper("Your Order Was Delivered 📦", `
      <p>Hi ${d.buyerName},</p>
      <p><strong>${d.sellerName}</strong> has delivered your order <strong>${d.orderNumber}</strong>.</p>
      <p>Please review the delivery and accept it or request a revision within 3 days.</p>
      ${btn(String(d.orderUrl), "Review Delivery")}
    `),

  order_completed: (d) =>
    wrapper("Order Complete ✅", `
      <p>Hi ${d.buyerName},</p>
      <p>Your order <strong>${d.orderNumber}</strong> is complete. Don't forget to leave a review.</p>
      ${btn(String(d.reviewUrl), "Leave a Review")}
    `),

  gig_approved: (d) =>
    wrapper("Your Gig Is Live! 🎉", `
      <p>Hi ${d.sellerName},</p>
      <p>Your gig <strong>${d.gigTitle}</strong> has been approved and is now live on Freelance Marketplace.</p>
      ${btn(String(d.gigUrl), "View Your Gig", "#0D9488")}
    `),

  gig_rejected: (d) =>
    wrapper("Gig Needs Updates", `
      <p>Hi ${d.sellerName},</p>
      <p>Your gig <strong>${d.gigTitle}</strong> needs some changes before it can go live.</p>
      ${detailBlock(detailRow("Reason", String(d.reason)) + detailRow("Details", String(d.details ?? "—")))}
      ${btn(String(d.editUrl), "Update Your Gig", "#0D9488")}
    `),

  review_request: (d) =>
    wrapper("How Was Your Experience?", `
      <p>Hi ${d.buyerName},</p>
      <p>How was your experience with ${d.sellerName} on order <strong>${d.orderNumber}</strong>? Your feedback helps other buyers.</p>
      ${btn(String(d.reviewUrl), "Leave a Review")}
    `),

  funds_cleared: (d) =>
    wrapper("Funds Cleared 💰", `
      <p>Hi ${d.sellerName},</p>
      <p>$${d.amount} from order ${d.orderNumber} has cleared and is now available in your balance.</p>
      ${btn(String(d.earningsUrl), "View Earnings", "#0D9488")}
    `),

  withdrawal_processed: (d) =>
    wrapper("Withdrawal Processed", `
      <p>Hi ${d.sellerName},</p>
      <p>Your withdrawal of $${d.amount} to ${d.bankName} (****${d.last4}) is being processed and will arrive in 3–5 business days.</p>
    `),

  tip_received: (d) =>
    wrapper("You Got a Tip! 🎁", `
      <p>Hi ${d.sellerName},</p>
      <p>${d.buyerName} sent you a $${d.amount} tip for order ${d.orderNumber}. You received $${d.sellerAmount}.</p>
      ${d.message ? `<p style="font-style:italic;color:#374151;">"${d.message}"</p>` : ""}
    `),

  password_reset: (d) =>
    wrapper("Reset Your Password", `
      <p>Hi ${d.userName},</p>
      <p>Click the button below to reset your password. The link expires in 1 hour.</p>
      ${btn(String(d.resetUrl), "Reset Password")}
    `),

  dispute_opened: (d) =>
    wrapper("Dispute Opened", `
      <p>Hi ${d.recipientName},</p>
      <p>A dispute has been opened on order <strong>${d.orderNumber}</strong>. Our team will review it shortly.</p>
      ${btn(String(d.orderUrl), "View Order")}
    `),
};
