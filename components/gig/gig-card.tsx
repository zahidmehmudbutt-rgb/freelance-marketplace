"use client";
import Link from "next/link";
import Image from "next/image";
import { Heart, Star } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SellerLevelBadge } from "@/components/seller/seller-level-badge";
import { formatMoney, initials } from "@/lib/utils/format";
import type { SellerLevel } from "@/types/database.types";
import { cn } from "@/lib/utils/cn";

export interface GigCardData {
  id: string;
  slug: string;
  title: string;
  thumbnail_url: string | null;
  average_rating: number;
  total_reviews: number;
  starting_price: number;
  seller: {
    username: string;
    full_name: string;
    avatar_url: string | null;
    seller_level: SellerLevel;
  };
}

export function GigCard({
  gig,
  className,
  initialFavorited = false,
}: {
  gig: GigCardData;
  className?: string;
  initialFavorited?: boolean;
}) {
  const router = useRouter();
  const [fav, setFav] = useState(initialFavorited);
  const [pending, setPending] = useState(false);
  const hasRating = gig.total_reviews > 0;

  async function toggleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    if (pending) return;
    const prev = fav;
    setFav(!prev);
    setPending(true);
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gig_id: gig.id }),
      });
      if (res.status === 401) {
        setFav(prev);
        toast.error("Sign in to save gigs", {
          action: { label: "Sign in", onClick: () => router.push("/login?redirect=" + window.location.pathname) },
        });
        return;
      }
      if (!res.ok) {
        setFav(prev);
        toast.error("Couldn't update favorites");
        return;
      }
      const data = await res.json();
      setFav(Boolean(data.favorited));
    } catch {
      setFav(prev);
      toast.error("Network error");
    } finally {
      setPending(false);
    }
  }

  return (
    <Link
      href={`/gig/${gig.slug}`}
      className={cn(
        "group block bg-white border border-line rounded-xl overflow-hidden",
        "transition-all hover:border-line-strong hover:shadow-card-hover",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
        className
      )}
    >
      <div className="relative aspect-[5/3] bg-canvas-subtle overflow-hidden">
        {gig.thumbnail_url ? (
          <Image
            src={gig.thumbnail_url}
            alt={gig.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            sizes="(min-width: 1024px) 280px, (min-width: 640px) 50vw, 100vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-ink-faint text-2xl font-semibold tracking-tight">
            Freelance Marketplace
          </div>
        )}
        <button
          onClick={toggleFavorite}
          disabled={pending}
          className="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur-sm w-8 h-8 rounded-full flex items-center justify-center shadow-card hover:bg-white transition-colors disabled:opacity-60"
          aria-label={fav ? "Remove from favorites" : "Save to favorites"}
          aria-pressed={fav}
        >
          <Heart className={cn("w-4 h-4 transition-colors", fav ? "fill-error text-error" : "text-ink-muted")} />
        </button>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 mb-2.5">
          <Avatar className="w-6 h-6 shrink-0 border border-line">
            {gig.seller.avatar_url && <AvatarImage src={gig.seller.avatar_url} />}
            <AvatarFallback className="text-[10px] bg-canvas-subtle text-ink-muted">
              {initials(gig.seller.full_name)}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium text-ink truncate min-w-0 flex-1">
            {gig.seller.full_name}
          </span>
          {gig.seller.seller_level !== "new_seller" && (
            <SellerLevelBadge level={gig.seller.seller_level} className="shrink-0" />
          )}
        </div>

        <p className="text-sm text-ink font-medium leading-snug line-clamp-2 mb-3 min-h-[2.5rem] group-hover:text-brand-primary-dark transition-colors">
          {gig.title}
        </p>

        <div className="flex items-center gap-1 mb-3">
          {hasRating ? (
            <>
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span className="text-xs font-semibold text-ink">{gig.average_rating.toFixed(1)}</span>
              <span className="text-xs text-ink-subtle">({gig.total_reviews})</span>
            </>
          ) : (
            <span className="text-xs text-ink-faint">New seller</span>
          )}
        </div>

        <div className="flex items-baseline justify-between pt-3 border-t border-line-subtle">
          <span className="text-xs text-ink-subtle uppercase tracking-wide font-medium">From</span>
          <span className="text-base font-semibold text-ink tabular-nums">
            {formatMoney(gig.starting_price)}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function GigCardSkeleton() {
  return (
    <div className="bg-white border border-line rounded-xl overflow-hidden">
      <div className="aspect-[5/3] skeleton" />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full skeleton" />
          <div className="h-3 flex-1 skeleton rounded" />
        </div>
        <div className="space-y-1.5">
          <div className="h-3.5 skeleton rounded" />
          <div className="h-3.5 skeleton rounded w-3/4" />
        </div>
        <div className="h-3 skeleton rounded w-1/3" />
        <div className="flex justify-between pt-3 border-t border-line-subtle">
          <div className="h-3 skeleton rounded w-10" />
          <div className="h-4 skeleton rounded w-14" />
        </div>
      </div>
    </div>
  );
}
