import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth-provider";
import { AppShell } from "@/components/app-shell";
import { ThemeProvider } from "@/components/theme-provider";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Brewing Tracker",
  description: "Brewery production and inventory tracking app."
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  let serverUser = null;

  if (hasSupabaseEnv()) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (user && !userError) {
        const { data: profile } = await supabase
          .from("app_users")
          .select("full_name, role, status")
          .eq("id", user.id)
          .maybeSingle();

        serverUser = {
          id: user.id,
          email: user.email ?? "",
          name: profile?.full_name ?? (user.user_metadata?.full_name as string) ?? user.email ?? "",
          role: (profile?.role ?? "General User") as import("@/lib/types").UserRole,
          status: (profile?.status ?? "active") as string
        };
      }
    } catch {
      // not authenticated — fine
    }
  }

  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <AuthProvider serverUser={serverUser}>
            <AppShell>{children}</AppShell>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
