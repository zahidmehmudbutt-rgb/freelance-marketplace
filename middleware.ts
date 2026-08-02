import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "./lib/supabase/middleware";

// Note: /seller/[username] is PUBLIC; only /seller/{dashboard,gigs,orders,earnings,analytics,stripe} are protected.
const AUTH_REQUIRED_EXACT = [
  "/dashboard",
  "/messages",
  "/settings",
  "/checkout",
  "/seller/dashboard",
  "/seller/gigs",
  "/seller/orders",
  "/seller/earnings",
  "/seller/analytics",
  "/seller/stripe",
];
const AUTH_REQUIRED_PREFIX = ["/order/"];
const ADMIN_REQUIRED = ["/admin"];

function isAuthRequired(pathname: string): boolean {
  if (AUTH_REQUIRED_EXACT.some((p) => pathname === p || pathname.startsWith(p + "/"))) return true;
  if (AUTH_REQUIRED_PREFIX.some((p) => pathname.startsWith(p))) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { response, supabase, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (ADMIN_REQUIRED.some((p) => pathname.startsWith(p))) {
    if (!user) return NextResponse.rewrite(new URL("/404", request.url));
    const { data } = await supabase.from("users").select("is_admin").eq("id", user.id).single();
    if (!data?.is_admin) return NextResponse.rewrite(new URL("/404", request.url));
  }

  if (isAuthRequired(pathname) && !user) {
    const redirect = new URL("/login", request.url);
    redirect.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirect);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
