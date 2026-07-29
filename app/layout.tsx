import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { UserProvider } from "@/lib/contexts/user-context";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@/types/database.types";

export const metadata: Metadata = {
  title: "Brellis — Find the Right Freelancer. Get It Done.",
  description: "Browse services from verified professionals. Quality work, transparent pricing, secure payments.",
};

async function getCurrentUser(): Promise<User | null> {
  try {
    const sb = createClient();
    const { data: { user: authUser } } = await sb.auth.getUser();
    if (!authUser) return null;
    const { data } = await sb.from("users").select("*").eq("id", authUser.id).maybeSingle();
    return (data as User) ?? null;
  } catch {
    return null;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col bg-white text-neutral-900">
        <UserProvider initialUser={user}>
          {children}
          <Toaster />
        </UserProvider>
      </body>
    </html>
  );
}
