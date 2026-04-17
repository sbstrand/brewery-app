"use client";

import { useState } from "react";
import { signIn, signUp, forgotPassword } from "@/app/actions/auth";

type Tab = "signin" | "signup" | "forgot";

const MESSAGES: Record<string, string> = {
  "pending": "Your account request has been submitted. An administrator will review and approve your access.",
  "reset-sent": "Password reset email sent. Check your inbox.",
  "account-created": "Account created. You can sign in now."
};

export function LoginScreen({
  error,
  message,
  defaultTab
}: {
  error: string;
  message: string;
  defaultTab: Tab;
}) {
  const [tab, setTab] = useState<Tab>(defaultTab);

  const messageText = MESSAGES[message] ?? "";

  return (
    <div className="flex min-h-screen items-start justify-center px-4 pt-16 bg-[var(--background)]">
      <div className="w-full max-w-md">
        {/* Logo / brand */}
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-muted">Brewery Ops</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">Brewing Tracker</h1>
        </div>

        <div className="panel overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-[var(--border)]">
            {([["signin", "Sign in"], ["signup", "Create account"], ["forgot", "Forgot password"]] as [Tab, string][]).map(([t, label]) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`flex-1 py-3 text-sm font-semibold transition ${
                  tab === t
                    ? "border-b-2 border-[var(--accent)] text-[var(--accent)]"
                    : "text-muted hover:text-ink"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Alerts */}
            {error && (
              <div className="mb-5 border border-[rgba(139,45,45,0.2)] bg-[rgba(139,45,45,0.08)] px-4 py-3 text-sm text-[var(--danger)]">
                {error}
              </div>
            )}
            {messageText && (
              <div className="mb-5 border border-[rgba(43,110,74,0.2)] bg-[rgba(43,110,74,0.08)] px-4 py-3 text-sm text-[var(--success)]">
                {messageText}
              </div>
            )}

            {/* Sign in */}
            {tab === "signin" && (
              <form action={signIn} className="space-y-4">
                <label className="block text-sm">
                  <span className="mb-2 block text-muted">Email</span>
                  <input className="input-shell" name="email" type="email" placeholder="you@brewery.com" required autoComplete="email" />
                </label>
                <label className="block text-sm">
                  <span className="mb-2 block text-muted">Password</span>
                  <input className="input-shell" name="password" type="password" placeholder="••••••••" required autoComplete="current-password" />
                </label>
                <button className="button-primary w-full" type="submit">Sign in</button>
                <p className="text-center text-sm text-muted">
                  <button type="button" onClick={() => setTab("forgot")} className="underline-offset-2 hover:underline">
                    Forgot your password?
                  </button>
                </p>
              </form>
            )}

            {/* Create account */}
            {tab === "signup" && (
              <form action={signUp} className="space-y-4">
                <label className="block text-sm">
                  <span className="mb-2 block text-muted">Full name</span>
                  <input className="input-shell" name="fullName" type="text" placeholder="Your name" required autoComplete="name" />
                </label>
                <label className="block text-sm">
                  <span className="mb-2 block text-muted">Email</span>
                  <input className="input-shell" name="email" type="email" placeholder="you@brewery.com" required autoComplete="email" />
                </label>
                <label className="block text-sm">
                  <span className="mb-2 block text-muted">Password</span>
                  <input className="input-shell" name="password" type="password" placeholder="At least 6 characters" required minLength={6} autoComplete="new-password" />
                </label>
                <label className="block text-sm">
                  <span className="mb-2 block text-muted">Confirm password</span>
                  <input className="input-shell" name="confirmPassword" type="password" placeholder="••••••••" required autoComplete="new-password" />
                </label>
                <button className="button-primary w-full" type="submit">Request access</button>
                <p className="text-center text-xs text-muted">
                  After submitting, an administrator will review and approve your account before you can sign in.
                </p>
              </form>
            )}

            {/* Forgot password */}
            {tab === "forgot" && (
              <form action={forgotPassword} className="space-y-4">
                <p className="text-sm text-muted">Enter your email and we'll send you a link to reset your password.</p>
                <label className="block text-sm">
                  <span className="mb-2 block text-muted">Email</span>
                  <input className="input-shell" name="email" type="email" placeholder="you@brewery.com" required autoComplete="email" />
                </label>
                <button className="button-primary w-full" type="submit">Send reset link</button>
                <p className="text-center text-sm text-muted">
                  <button type="button" onClick={() => setTab("signin")} className="underline-offset-2 hover:underline">
                    Back to sign in
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
