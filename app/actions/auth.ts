"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function readField(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function signIn(formData: FormData) {
  const email = readField(formData, "email");
  const password = readField(formData, "password");

  if (!email || !password) redirect("/login?error=missing-fields");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);

  // Check account status
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("app_users")
      .select("status")
      .eq("id", user.id)
      .single();

    if (profile?.status === "pending") {
      await supabase.auth.signOut();
      redirect("/login?error=Your+account+is+pending+administrator+approval.");
    }
    if (profile?.status === "inactive") {
      await supabase.auth.signOut();
      redirect("/login?error=Your+account+has+been+deactivated.+Contact+an+administrator.");
    }
  }

  revalidatePath("/", "layout");
  redirect("/");}

export async function signUp(formData: FormData) {
  const email = readField(formData, "email");
  const password = readField(formData, "password");
  const confirmPassword = readField(formData, "confirmPassword");
  const fullName = readField(formData, "fullName");

  if (!email || !password || !fullName) redirect("/login?tab=signup&error=All+fields+are+required.");
  if (password !== confirmPassword) redirect("/login?tab=signup&error=Passwords+do+not+match.");
  if (password.length < 6) redirect("/login?tab=signup&error=Password+must+be+at+least+6+characters.");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });

  if (error) redirect(`/login?tab=signup&error=${encodeURIComponent(error.message)}`);

  const userId = data.user?.id;
  if (userId) {
    await supabase.from("app_users").upsert(
      { id: userId, full_name: fullName, email, role: "General User", status: "pending" },
      { onConflict: "id" }
    );
  }

  redirect("/login?message=pending");
}

export async function forgotPassword(formData: FormData) {
  const email = readField(formData, "email");
  if (!email) redirect("/login?tab=forgot&error=Email+is+required.");

  const supabase = await createSupabaseServerClient();

  // Validate the email belongs to an active user
  const { data: profile } = await supabase
    .from("app_users")
    .select("status")
    .eq("email", email)
    .single();

  if (!profile) redirect("/login?tab=forgot&error=No+account+found+with+that+email.");
  if (profile.status === "pending") redirect("/login?tab=forgot&error=This+account+is+pending+approval.");
  if (profile.status === "inactive") redirect("/login?tab=forgot&error=This+account+has+been+deactivated.");

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/reset-password`
  });

  if (error) redirect(`/login?tab=forgot&error=${encodeURIComponent(error.message)}`);

  redirect("/login?message=reset-sent");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
