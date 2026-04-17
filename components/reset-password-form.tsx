"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }

    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) { setError(error.message); return; }
      router.push("/login?message=account-created");
    });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error && (
        <div className="border border-[rgba(139,45,45,0.2)] bg-[rgba(139,45,45,0.08)] px-4 py-3 text-sm text-[var(--danger)]">
          {error}
        </div>
      )}
      <label className="block text-sm">
        <span className="mb-2 block text-muted">New password</span>
        <input className="input-shell" type="password" placeholder="At least 6 characters" required minLength={6}
          value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
      </label>
      <label className="block text-sm">
        <span className="mb-2 block text-muted">Confirm password</span>
        <input className="input-shell" type="password" placeholder="••••••••" required
          value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
      </label>
      <button className="button-primary w-full" type="submit">Update password</button>
    </form>
  );
}
