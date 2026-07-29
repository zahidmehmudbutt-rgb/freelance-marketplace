"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, Menu, Search, Heart, User as UserIcon, LayoutDashboard, MessageCircle, Settings, ShieldCheck, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { SearchAutocomplete } from "@/components/search/search-autocomplete";
import { useUser } from "@/lib/contexts/user-context";
import { initials } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const NAV_LINKS = [
  { href: "/search", label: "Browse" },
  { href: "/how-it-works", label: "How it works" },
];

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser } = useUser();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnread(0);
      return;
    }
    const sb = createClient();
    let convChannel: ReturnType<typeof sb.channel> | null = null;

    async function refreshUnread() {
      const { data: convs } = await sb
        .from("conversations")
        .select("buyer_id, seller_id, buyer_unread_count, seller_unread_count")
        .or(`buyer_id.eq.${user!.id},seller_id.eq.${user!.id}`);
      const total = (convs ?? []).reduce((sum, c) => {
        const isBuyer = c.buyer_id === user!.id;
        return sum + (isBuyer ? c.buyer_unread_count : c.seller_unread_count);
      }, 0);
      setUnread(total);
    }

    (async () => {
      await refreshUnread();
      convChannel = sb
        .channel(`nav-conv-unread-${user.id}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "conversations" },
          () => { refreshUnread(); }
        )
        .subscribe();
    })();

    return () => {
      if (convChannel) sb.removeChannel(convChannel);
    };
  }, [user]);

  async function signOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    setUser(null);
    router.push("/");
    router.refresh();
  }

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
        <Link
          href="/"
          className="text-xl font-semibold text-brand-primary tracking-tight whitespace-nowrap shrink-0 hover:text-brand-primary-dark transition-colors"
        >
          Brellis
        </Link>

        <div className="hidden md:block flex-1 min-w-0 max-w-xl">
          <SearchAutocomplete placeholder="What service are you looking for?" />
        </div>

        <nav className="hidden lg:flex items-center gap-1 text-sm shrink-0">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "px-3 h-9 inline-flex items-center rounded-md transition-colors",
                isActive(l.href)
                  ? "text-brand-primary-dark bg-brand-primary-50"
                  : "text-ink-muted hover:text-ink hover:bg-canvas-subtle"
              )}
            >
              {l.label}
            </Link>
          ))}
          {!user?.is_seller && (
            <Link
              href="/become-seller"
              className="px-3 h-9 inline-flex items-center rounded-md text-ink-muted hover:text-ink hover:bg-canvas-subtle transition-colors"
            >
              Become a seller
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-1 ml-auto shrink-0">
          {user ? (
            <>
              <Link
                href="/favorites"
                aria-label="Favorites"
                className="hidden sm:inline-flex w-9 h-9 items-center justify-center rounded-md text-ink-muted hover:text-ink hover:bg-canvas-subtle transition-colors"
              >
                <Heart className="w-[18px] h-[18px]" />
              </Link>
              <Link
                href="/messages"
                aria-label={unread > 0 ? `Messages (${unread} unread)` : "Messages"}
                className="relative w-9 h-9 inline-flex items-center justify-center rounded-md text-ink-muted hover:text-ink hover:bg-canvas-subtle transition-colors"
              >
                <Bell className="w-[18px] h-[18px]" />
                {unread > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 inline-flex items-center justify-center rounded-full bg-error text-white text-[10px] font-semibold leading-none ring-2 ring-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="ml-1 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                    aria-label="Account menu"
                  >
                    <Avatar className="w-8 h-8 border border-line">
                      {user.avatar_url && <AvatarImage src={user.avatar_url} />}
                      <AvatarFallback className="text-xs bg-canvas-subtle text-ink-muted">
                        {initials(user.full_name)}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel>
                    <div className="font-semibold text-ink truncate">{user.full_name}</div>
                    <div className="text-xs text-ink-subtle font-normal truncate">@{user.username}</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => router.push("/dashboard")}>Dashboard</DropdownMenuItem>
                  {user.is_seller && (
                    <DropdownMenuItem onSelect={() => router.push("/seller/dashboard")}>
                      Seller Dashboard
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onSelect={() => router.push("/messages")}>Messages</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => router.push("/settings")}>Settings</DropdownMenuItem>
                  {user.is_admin && (
                    <DropdownMenuItem onSelect={() => router.push("/admin")}>Admin</DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={signOut}>Sign out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:inline-flex h-9 px-3 items-center rounded-md text-sm font-medium text-ink-muted hover:text-ink hover:bg-canvas-subtle transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="inline-flex h-9 px-4 items-center rounded-md text-sm font-medium bg-brand-primary text-white hover:bg-brand-primary-dark transition-colors"
              >
                Join
              </Link>
            </>
          )}
          <Sheet>
            <SheetTrigger asChild>
              <button
                className="lg:hidden w-9 h-9 inline-flex items-center justify-center rounded-md text-ink-muted hover:text-ink hover:bg-canvas-subtle transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-[18px] h-[18px]" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="p-0 flex flex-col">
              <div className="px-5 h-16 flex items-center border-b border-line">
                <span className="text-xl font-semibold text-brand-primary tracking-tight">Brellis</span>
              </div>

              <div className="p-5 border-b border-line">
                <SearchAutocomplete placeholder="Search services…" />
              </div>

              <nav className="flex-1 py-2">
                <MobileNavLink href="/search" label="Browse" icon={<Search className="w-4 h-4" />} />
                <MobileNavLink href="/how-it-works" label="How it works" icon={<UserIcon className="w-4 h-4" />} />
                {!user?.is_seller && (
                  <MobileNavLink href="/become-seller" label="Become a seller" icon={<ShieldCheck className="w-4 h-4" />} />
                )}

                {user && (
                  <>
                    <div className="my-2 border-t border-line" />
                    <MobileNavLink href="/dashboard" label="Dashboard" icon={<LayoutDashboard className="w-4 h-4" />} />
                    {user.is_seller && (
                      <MobileNavLink href="/seller/dashboard" label="Seller dashboard" icon={<LayoutDashboard className="w-4 h-4" />} />
                    )}
                    <MobileNavLink href="/messages" label="Messages" icon={<MessageCircle className="w-4 h-4" />} />
                    <MobileNavLink href="/favorites" label="Favorites" icon={<Heart className="w-4 h-4" />} />
                    <MobileNavLink href="/settings" label="Settings" icon={<Settings className="w-4 h-4" />} />
                    {user.is_admin && (
                      <MobileNavLink href="/admin" label="Admin" icon={<ShieldCheck className="w-4 h-4" />} />
                    )}
                  </>
                )}
              </nav>

              <div className="p-5 border-t border-line">
                {user ? (
                  <>
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="w-10 h-10 border border-line shrink-0">
                        {user.avatar_url && <AvatarImage src={user.avatar_url} />}
                        <AvatarFallback className="text-sm bg-canvas-subtle text-ink-muted">
                          {initials(user.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-ink truncate">{user.full_name}</p>
                        <p className="text-xs text-ink-subtle truncate">@{user.username}</p>
                      </div>
                    </div>
                    <SheetClose asChild>
                      <button
                        onClick={signOut}
                        className="w-full h-10 inline-flex items-center justify-center gap-2 rounded-md border border-line-strong text-sm font-medium text-ink-muted hover:bg-canvas-subtle hover:text-ink transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </SheetClose>
                  </>
                ) : (
                  <div className="flex gap-2">
                    <SheetClose asChild>
                      <Link
                        href="/login"
                        className="flex-1 h-10 inline-flex items-center justify-center rounded-md border border-line-strong text-sm font-medium text-ink hover:bg-canvas-subtle transition-colors"
                      >
                        Log in
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        href="/signup"
                        className="flex-1 h-10 inline-flex items-center justify-center rounded-md bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary-dark transition-colors"
                      >
                        Join
                      </Link>
                    </SheetClose>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

function MobileNavLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <SheetClose asChild>
      <Link
        href={href}
        className="flex items-center gap-3 px-5 h-11 text-sm font-medium text-ink hover:bg-canvas-subtle transition-colors"
      >
        <span className="text-ink-subtle">{icon}</span>
        {label}
      </Link>
    </SheetClose>
  );
}
