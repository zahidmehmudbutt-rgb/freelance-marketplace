import Link from "next/link";
import {
  Globe,
  Smartphone,
  Palette,
  Bot,
  TrendingUp,
  Briefcase,
  ShieldCheck,
  Clock,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { DemoBanner } from "@/components/layout/demo-banner";
import { Footer } from "@/components/layout/footer";
import { GigCard, GigCardSkeleton, type GigCardData } from "@/components/gig/gig-card";
import { SellerCard } from "@/components/seller/seller-card";
import { SearchAutocomplete } from "@/components/search/search-autocomplete";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 3600;

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Globe, Smartphone, Palette, Bot, TrendingUp, Briefcase,
};

type FeaturedGig = GigCardData;

type TopSeller = {
  username: string;
  full_name: string;
  avatar_url: string | null;
  seller_level: "new_seller" | "level_one" | "level_two" | "top_rated";
  rating: number;
  total_orders: number;
  tagline: string | null;
};

async function loadHomeData() {
  try {
    const sb = createClient();
    const [{ data: parentCategories }, { count: activeGigs }, { count: verifiedSellers }] = await Promise.all([
      sb.from("categories").select("*").is("parent_id", null).order("sort_order"),
      sb.from("gigs").select("id", { count: "exact", head: true }).eq("status", "active"),
      sb.from("users").select("id", { count: "exact", head: true }).eq("is_seller", true),
    ]);

    const { data: gigRows } = await sb
      .from("gigs")
      .select("id, slug, title, thumbnail_url, average_rating, total_reviews, seller_id")
      .eq("status", "active")
      .order("total_orders", { ascending: false })
      .limit(8);

    const { data: topSellerRows } = await sb
      .from("seller_profiles")
      .select("user_id, seller_level, average_rating, total_orders_completed, tagline")
      .order("average_rating", { ascending: false })
      .limit(4);

    const sellerIdsForGigs = Array.from(new Set((gigRows ?? []).map((g: any) => g.seller_id)));
    const sellerIdsForTop = (topSellerRows ?? []).map((s: any) => s.user_id);
    const allSellerIds = Array.from(new Set([...sellerIdsForGigs, ...sellerIdsForTop]));
    const gigIds = (gigRows ?? []).map((g: any) => g.id);

    const [{ data: users }, { data: profiles }, { data: packages }] = await Promise.all([
      allSellerIds.length > 0
        ? sb.from("users").select("id, username, full_name, avatar_url").in("id", allSellerIds)
        : Promise.resolve({ data: [] as any[] }),
      sellerIdsForGigs.length > 0
        ? sb.from("seller_profiles").select("user_id, seller_level").in("user_id", sellerIdsForGigs)
        : Promise.resolve({ data: [] as any[] }),
      gigIds.length > 0
        ? sb.from("gig_packages").select("gig_id, price").in("gig_id", gigIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const userById = new Map((users ?? []).map((u: any) => [u.id, u]));
    const profileById = new Map((profiles ?? []).map((p: any) => [p.user_id, p]));
    const minPriceByGig = new Map<string, number>();
    for (const p of packages ?? []) {
      const cur = minPriceByGig.get((p as any).gig_id);
      const price = Number((p as any).price);
      if (cur == null || price < cur) minPriceByGig.set((p as any).gig_id, price);
    }

    const featuredGigs: FeaturedGig[] = (gigRows ?? []).map((g: any) => {
      const u = userById.get(g.seller_id) as any;
      const p = profileById.get(g.seller_id) as any;
      return {
        id: g.id,
        slug: g.slug,
        title: g.title,
        thumbnail_url: g.thumbnail_url,
        average_rating: g.average_rating ?? 0,
        total_reviews: g.total_reviews ?? 0,
        starting_price: minPriceByGig.get(g.id) ?? 0,
        seller: {
          username: u?.username ?? "seller",
          full_name: u?.full_name ?? "Seller",
          avatar_url: u?.avatar_url ?? null,
          seller_level: p?.seller_level ?? "new_seller",
        },
      };
    });

    const topSellers: TopSeller[] = (topSellerRows ?? []).map((s: any) => {
      const u = userById.get(s.user_id) as any;
      return {
        username: u?.username ?? s.user_id,
        full_name: u?.full_name ?? "Top Seller",
        avatar_url: u?.avatar_url ?? null,
        seller_level: s.seller_level,
        rating: s.average_rating ?? 0,
        total_orders: s.total_orders_completed ?? 0,
        tagline: s.tagline ?? null,
      };
    });

    return {
      categories: parentCategories ?? [],
      activeGigs: activeGigs ?? 0,
      verifiedSellers: verifiedSellers ?? 0,
      featuredGigs,
      topSellers,
    };
  } catch {
    return { categories: [], activeGigs: 0, verifiedSellers: 0, featuredGigs: [], topSellers: [] };
  }
}

export default async function HomePage() {
  const data = await loadHomeData();

  return (
    <>
      <DemoBanner />
      <Navbar />
      <main>
        <section className="hero-bg border-b border-line">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl text-ink leading-[1.05] tracking-tight mb-5 text-balance">
              Find the right freelancer. Get it done.
            </h1>
            <p className="text-ink-muted text-base sm:text-lg mb-8 max-w-2xl mx-auto text-balance leading-relaxed">
              Browse services from verified professionals. Quality work, transparent pricing, secure payments.
            </p>
            <div className="max-w-2xl mx-auto mb-6">
              <SearchAutocomplete size="lg" placeholder="What service are you looking for today?" />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-subtle mr-1">Popular</span>
              {["Web Design", "Logo Design", "Bubble.io", "React Native", "AI Integration"].map((t) => (
                <Link
                  key={t}
                  href={`/search?q=${encodeURIComponent(t)}`}
                  className="inline-flex items-center h-7 px-3 rounded-full bg-white border border-line-strong text-xs font-medium text-ink-muted hover:border-brand-primary hover:text-brand-primary-dark hover:bg-brand-primary-50 transition-colors"
                >
                  {t}
                </Link>
              ))}
            </div>
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-center max-w-3xl mx-auto">
              <Stat number={`${data.activeGigs.toLocaleString()}+`} label="Active gigs" />
              <Stat number={`${data.verifiedSellers.toLocaleString()}+`} label="Verified sellers" />
              <Stat number="Escrow" label="Secure payments" />
              <Stat number="24/7" label="Support" />
            </div>
          </div>
        </section>

        {data.categories.length > 0 && (
          <section className="py-16 sm:py-20 border-b border-line">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="flex items-baseline justify-between mb-8 flex-wrap gap-3">
                <h2 className="font-heading text-2xl sm:text-3xl text-ink">Explore services</h2>
                <Link href="/search" className="text-sm font-medium text-brand-primary-dark hover:underline">
                  Browse all →
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {data.categories.map((cat: any) => {
                  const Icon = ICON_MAP[cat.icon_name] || Globe;
                  return (
                    <Link
                      key={cat.id}
                      href={`/category/${cat.slug}`}
                      className="group bg-white border border-line rounded-xl p-5 text-center transition-all hover:border-line-strong hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                    >
                      <div className="w-11 h-11 mx-auto mb-3 rounded-xl bg-brand-primary-50 text-brand-primary-dark flex items-center justify-center transition-colors group-hover:bg-brand-primary group-hover:text-white">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="font-semibold text-sm text-ink mb-0.5 truncate">{cat.name}</h3>
                      <p className="text-xs text-ink-subtle">{cat.gig_count ?? 0} gigs</p>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        <section className="py-16 sm:py-20 border-b border-line">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-baseline justify-between mb-8 flex-wrap gap-3">
              <div>
                <h2 className="font-heading text-2xl sm:text-3xl text-ink">Popular this week</h2>
                <p className="text-sm text-ink-subtle mt-1">Top-rated gigs across every category.</p>
              </div>
              <Link href="/search?sort=best_selling" className="text-sm font-medium text-brand-primary-dark hover:underline shrink-0">
                See all <ArrowRight className="w-3 h-3 inline -mt-0.5" />
              </Link>
            </div>
            {data.featuredGigs.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {Array.from({ length: 4 }).map((_, i) => <GigCardSkeleton key={i} />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {data.featuredGigs.map((g) => <GigCard key={g.id} gig={g} />)}
              </div>
            )}
          </div>
        </section>

        <section className="py-16 sm:py-20 border-b border-line bg-canvas-subtle">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary-dark mb-3">Pricing</p>
              <h2 className="font-heading text-2xl sm:text-3xl text-ink mb-2 text-balance">
                Transparent fees. No surprises at checkout.
              </h2>
              <p className="text-sm sm:text-base text-ink-muted max-w-2xl mx-auto leading-relaxed">
                Honest pricing — here&apos;s exactly what you pay and what sellers earn.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              <FeeCard
                title="If you order"
                base="$100"
                paid="$105.50"
                breakdown={[
                  { label: "Service", amount: "$100.00" },
                  { label: "Service fee (5.5%)", amount: "$5.50" },
                ]}
                accent="border-brand-primary/30 bg-white"
                amountColor="text-brand-primary-dark"
              />
              <FeeCard
                title="A seller receives"
                base="from your $100"
                paid="$80.00"
                breakdown={[
                  { label: "Order amount", amount: "$100.00" },
                  { label: "Commission (20%)", amount: "−$20.00" },
                ]}
                accent="border-brand-accent/30 bg-white"
                amountColor="text-brand-accent-dark"
              />
            </div>
            <p className="text-xs text-ink-subtle text-center mt-6 max-w-2xl mx-auto leading-relaxed">
              The 20% seller commission funds platform security, payment protection, dispute resolution,
              and the team behind Freelance Marketplace.
            </p>
          </div>
        </section>

        {data.topSellers.length > 0 && (
          <section className="py-16 sm:py-20 border-b border-line">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="flex items-baseline justify-between mb-8 flex-wrap gap-3">
                <div>
                  <h2 className="font-heading text-2xl sm:text-3xl text-ink">Our top sellers</h2>
                  <p className="text-sm text-ink-subtle mt-1">Highest-rated professionals on the platform.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {data.topSellers.map((s) => (
                  <SellerCard
                    key={s.username}
                    username={s.username}
                    fullName={s.full_name}
                    avatarUrl={s.avatar_url}
                    level={s.seller_level}
                    rating={s.rating}
                    totalOrders={s.total_orders}
                    tagline={s.tagline}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F4845] via-[#0F766E] to-[#064E50] text-white px-6 sm:px-10 py-14 sm:py-16">
              <div
                className="absolute inset-0 opacity-[0.12] pointer-events-none"
                style={{
                  backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)",
                  backgroundSize: "28px 28px",
                }}
              />
              <div className="relative max-w-2xl mx-auto text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary-50/80 mb-3">
                  Start selling
                </p>
                <h2 className="font-heading text-3xl sm:text-4xl text-white text-balance leading-tight mb-3">
                  Turn your skills into income.
                </h2>
                <p className="text-white/80 text-base sm:text-lg mb-7 max-w-xl mx-auto text-balance">
                  Join thousands of professionals earning on Freelance Marketplace — no upfront cost, no monthly fees.
                </p>
                <Link
                  href="/become-seller"
                  className="inline-flex items-center justify-center h-12 px-6 rounded-md bg-white text-ink font-semibold text-sm hover:bg-canvas-subtle transition-colors"
                >
                  Start selling today
                </Link>
                <div className="mt-10 grid grid-cols-3 gap-6 max-w-md mx-auto">
                  <Trust icon={<ShieldCheck className="w-4 h-4" />} title="Escrow protected" />
                  <Trust icon={<Clock className="w-4 h-4" />} title="On-time delivery" />
                  <Trust icon={<CheckCircle2 className="w-4 h-4" />} title="Verified reviews" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <p className="font-heading text-2xl sm:text-3xl text-ink tabular-nums">{number}</p>
      <p className="text-xs text-ink-subtle mt-1 uppercase tracking-wider font-medium">{label}</p>
    </div>
  );
}

function FeeCard({
  title,
  base,
  paid,
  breakdown,
  accent,
  amountColor,
}: {
  title: string;
  base: string;
  paid: string;
  breakdown: { label: string; amount: string }[];
  accent: string;
  amountColor: string;
}) {
  return (
    <div className={`rounded-2xl border-2 p-6 sm:p-7 ${accent}`}>
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <p className="text-sm font-medium text-ink">{title}</p>
        <p className="text-xs text-ink-subtle">{base}</p>
      </div>
      <p className={`font-heading text-4xl sm:text-5xl mb-5 tabular-nums tracking-tight ${amountColor}`}>{paid}</p>
      <div className="space-y-2 text-sm pt-4 border-t border-line">
        {breakdown.map((b) => (
          <div key={b.label} className="flex justify-between">
            <span className="text-ink-muted">{b.label}</span>
            <span className="tabular-nums font-semibold text-ink">{b.amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Trust({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-9 h-9 rounded-full bg-white/10 ring-1 ring-white/15 flex items-center justify-center text-white/90">
        {icon}
      </div>
      <span className="text-xs text-white/75 font-medium text-center leading-tight">{title}</span>
    </div>
  );
}
