import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Freelance Marketplace — Find the Right Freelancer. Get It Done.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#0F4845",
          backgroundImage:
            "radial-gradient(ellipse at 15% 15%, #0D948855 0%, transparent 55%), radial-gradient(ellipse at 85% 10%, #F9731633 0%, transparent 50%)",
          padding: "80px",
          color: "white",
          fontFamily: "Inter, system-ui",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 48 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "linear-gradient(135deg, #0D9488, #F97316)",
            }}
          />
          <div style={{ fontSize: 34, fontWeight: 700 }}>Freelance Marketplace</div>
        </div>

        <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.08, maxWidth: 940 }}>
          Find the right freelancer.{" "}
          <span style={{ color: "#5EEAD4" }}>Get it done.</span>
        </div>

        <div style={{ fontSize: 30, color: "#cbd5e1", marginTop: 26, maxWidth: 900 }}>
          Gig listings · Seller storefronts · Escrow payments · Admin moderation
        </div>

        <div style={{ display: "flex", gap: 16, marginTop: "auto", fontSize: 23, color: "#a7b3b1" }}>
          <span style={{ padding: "10px 18px", borderRadius: 999, border: "1px solid #ffffff26" }}>
            Next.js 14
          </span>
          <span style={{ padding: "10px 18px", borderRadius: 999, border: "1px solid #ffffff26" }}>
            Supabase + RLS
          </span>
          <span style={{ padding: "10px 18px", borderRadius: 999, border: "1px solid #ffffff26" }}>
            Stripe
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
