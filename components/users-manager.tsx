"use client";

import { useState, useTransition } from "react";
import { AppUser } from "@/lib/types";

export function UsersManager({
  users,
  createAction,
  updateRoleAction,
  updateStatusAction
}: {
  users: AppUser[];
  createAction: (formData: FormData) => Promise<void>;
  updateRoleAction: (formData: FormData) => Promise<void>;
  updateStatusAction: (formData: FormData) => Promise<void>;
}) {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "General User" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [, startTransition] = useTransition();

  const pending = users.filter((u) => u.status === "pending");
  const active = users.filter((u) => u.status === "active");
  const inactive = users.filter((u) => u.status === "inactive");

  function updateField(name: string, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setSuccess("");
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        await createAction(formData);
        setForm({ name: "", email: "", password: "", role: "General User" });
        setSuccess("User created successfully.");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to create user.");
      }
    });
  }

  function setStatus(id: string, status: string) {
    const fd = new FormData();
    fd.set("id", id); fd.set("status", status);
    startTransition(() => updateStatusAction(fd));
  }

  function toggleRole(user: AppUser) {
    const fd = new FormData();
    fd.set("id", user.id);
    fd.set("role", user.role === "Admin" ? "General User" : "Admin");
    startTransition(() => updateRoleAction(fd));
  }

  return (
    <div className="space-y-6">

      {/* Pending requests */}
      {pending.length > 0 && (
        <section className="panel p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <h3 className="text-xl font-semibold">Access requests</h3>
            <span className="pill pill-warning">{pending.length} pending</span>
          </div>
          <div className="ops-divider">
            {pending.map((user) => (
              <div key={user.id} className="ops-item">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-lg font-semibold">{user.name}</p>
                    <p className="text-sm text-muted">{user.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setStatus(user.id, "active")} className="button-primary text-sm">
                      Approve
                    </button>
                    <button type="button" onClick={() => setStatus(user.id, "inactive")} className="button-secondary text-sm">
                      Deny
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Active users */}
      <section className="panel p-5 sm:p-6">
        <h3 className="mb-5 text-xl font-semibold">Active users</h3>
        <div className="ops-divider">
          {active.map((user) => (
            <div key={user.id} className="ops-item">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-lg font-semibold">{user.name}</p>
                  <p className="text-sm text-muted">{user.email} • {user.role}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => toggleRole(user)} className="button-secondary text-sm">
                    Make {user.role === "Admin" ? "General User" : "Admin"}
                  </button>
                  <button type="button" onClick={() => setStatus(user.id, "inactive")} className="button-secondary text-sm">
                    Deactivate
                  </button>
                </div>
              </div>
            </div>
          ))}
          {active.length === 0 && <p className="py-2 text-sm text-muted">No active users.</p>}
        </div>
      </section>

      {/* Inactive users */}
      {inactive.length > 0 && (
        <section className="panel p-5 sm:p-6">
          <h3 className="mb-5 text-xl font-semibold">Inactive users</h3>
          <div className="ops-divider">
            {inactive.map((user) => (
              <div key={user.id} className="ops-item">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-muted">{user.name}</p>
                    <p className="text-sm text-muted">{user.email} • {user.role}</p>
                  </div>
                  <button type="button" onClick={() => setStatus(user.id, "active")} className="button-secondary text-sm">
                    Reactivate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Add new user */}
      <section className="panel p-5 sm:p-6">
        <h3 className="mb-5 text-xl font-semibold">Add new user</h3>
        {error && <div className="mb-4 border border-[rgba(139,45,45,0.2)] bg-[rgba(139,45,45,0.08)] px-4 py-3 text-sm text-[var(--danger)]">{error}</div>}
        {success && <div className="mb-4 border border-[rgba(43,110,74,0.2)] bg-[rgba(43,110,74,0.08)] px-4 py-3 text-sm text-[var(--success)]">{success}</div>}
        <form className="grid gap-4 lg:grid-cols-2" onSubmit={handleSubmit}>
          <label className="text-sm">
            <span className="mb-2 block text-muted">Full name</span>
            <input className="input-shell" name="fullName" required value={form.name} onChange={(e) => updateField("name", e.target.value)} />
          </label>
          <label className="text-sm">
            <span className="mb-2 block text-muted">Email</span>
            <input className="input-shell" name="email" type="email" required value={form.email} onChange={(e) => updateField("email", e.target.value)} />
          </label>
          <label className="text-sm">
            <span className="mb-2 block text-muted">Password</span>
            <input className="input-shell" name="password" type="password" required minLength={6} value={form.password} onChange={(e) => updateField("password", e.target.value)} />
          </label>
          <label className="text-sm">
            <span className="mb-2 block text-muted">Role</span>
            <select className="input-shell" name="role" value={form.role} onChange={(e) => updateField("role", e.target.value)}>
              <option value="Admin">Admin</option>
              <option value="General User">General User</option>
            </select>
          </label>
          <div className="lg:col-span-2">
            <button className="button-primary" type="submit">Add user</button>
          </div>
        </form>
      </section>
    </div>
  );
}
