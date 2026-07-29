"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function GigGallery({
  thumbnail,
  images,
  title,
}: {
  thumbnail: string | null;
  images: string[] | null | undefined;
  title: string;
}) {
  const all = [thumbnail, ...(images ?? [])].filter((u): u is string => Boolean(u));
  const total = all.length;
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const next = useCallback(() => setIndex((i) => (i + 1) % total), [total]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + total) % total), [total]);

  useEffect(() => {
    if (!lightbox) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightbox(false);
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightbox, next, prev]);

  if (total === 0) {
    return (
      <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-canvas-subtle border border-line flex items-center justify-center text-ink-faint text-5xl font-semibold tracking-tight">
        Freelance Marketplace
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-canvas-subtle border border-line group">
        <Image
          src={all[index]}
          alt={`${title} — image ${index + 1} of ${total}`}
          fill
          className="object-cover"
          priority={index === 0}
          sizes="(min-width: 1024px) 720px, 100vw"
        />

        {total > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 backdrop-blur-sm shadow-card flex items-center justify-center text-ink-muted hover:text-ink hover:bg-white transition-colors opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={next}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 backdrop-blur-sm shadow-card flex items-center justify-center text-ink-muted hover:text-ink hover:bg-white transition-colors opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 px-2.5 py-1 rounded-full bg-ink/60 backdrop-blur-sm">
              {all.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  aria-label={`Go to image ${i + 1}`}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === index ? "w-5 bg-white" : "w-1.5 bg-white/50 hover:bg-white/70"
                  )}
                />
              ))}
            </div>
          </>
        )}

        <button
          onClick={() => setLightbox(true)}
          aria-label="Expand image"
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 backdrop-blur-sm shadow-card flex items-center justify-center text-ink-muted hover:text-ink hover:bg-white transition-colors opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {total > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
          {all.map((src, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Show image ${i + 1}`}
              aria-current={i === index}
              className={cn(
                "relative shrink-0 w-20 h-14 sm:w-24 sm:h-16 rounded-md overflow-hidden border-2 transition-all bg-canvas-subtle",
                i === index ? "border-brand-primary opacity-100" : "border-transparent opacity-60 hover:opacity-100"
              )}
            >
              <Image src={src} alt="" fill className="object-cover" sizes="100px" />
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-ink/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
          onClick={() => setLightbox(false)}
        >
          <button
            onClick={() => setLightbox(false)}
            aria-label="Close"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div
            className="relative w-full max-w-5xl aspect-[16/10]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={all[index]}
              alt={`${title} — image ${index + 1} of ${total}`}
              fill
              className="object-contain"
              sizes="100vw"
            />
            {total > 1 && (
              <>
                <button
                  onClick={prev}
                  aria-label="Previous image"
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={next}
                  aria-label="Next image"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-medium tabular-nums">
                  {index + 1} / {total}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
