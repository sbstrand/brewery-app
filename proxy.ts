import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_PATHS = ["/login", "/reset-password"];

export async function proxy(request: NextRequest) {
  const response = await updateSession(request);

  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return response;
  }

  const supabase = createServerClient(env.supabaseUrl!, env.supabaseAnonKey!, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
      }
    }
  });

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  // Block pending/inactive accounts
  const { data: profile } = await supabase
    .from("app_users")
    .select("status")
    .eq("id", user.id)
    .single();

  // Block pending/inactive accounts — redirect without trying to sign out
  // (can't reliably sign out in middleware; signIn action handles this)
  if (profile?.status === "pending") {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("error", "Your account is pending administrator approval.");
    const redirectResponse = NextResponse.redirect(loginUrl);
    // Clear the session cookie so they're fully signed out
    redirectResponse.cookies.delete("sb-rffegeuybufamnkbztyx-auth-token");
    return redirectResponse;
  }

  if (profile?.status === "inactive") {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("error", "Your account has been deactivated. Contact an administrator.");
    const redirectResponse = NextResponse.redirect(loginUrl);
    redirectResponse.cookies.delete("sb-rffegeuybufamnkbztyx-auth-token");
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
