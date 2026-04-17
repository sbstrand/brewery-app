"use client";

import Link from "next/link";
import { ReactNode, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { useTheme } from "@/components/theme-provider";
import { useNotifications } from "@/components/notification-context";
import { signOut } from "@/app/actions/auth";
import { formatDate, stageTone } from "@/lib/utils";
import { Dialog } from "@/components/dialog";
import { Batch, BatchLog } from "@/lib/types";
import { getBatchLogs } from "@/app/actions/data";

const NO_HEADER_PATHS = ["/login", "/reset-password"];
const PREVIEW_LIMIT = 5;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { currentUser, isAdmin } = useAuth();
  const { theme, toggle } = useTheme();
  const { activity, batches } = useNotifications();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [allOpen, setAllOpen] = useState(false);
  const [filterDate, setFilterDate] = useState("");
  const [lastSeenAt, setLastSeenAt] = useState<string>("1970-01-01");

  useEffect(() => {
    try { setLastSeenAt(localStorage.getItem("notif-last-seen") ?? "1970-01-01"); } catch {}
  }, []);
  const [previewBatch, setPreviewBatch] = useState<Batch | null>(null);
  const [previewLogs, setPreviewLogs] = useState<BatchLog[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const hideHeader = NO_HEADER_PATHS.some((p) => pathname.startsWith(p));

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const preview = activity.slice(0, PREVIEW_LIMIT);
  const filtered = filterDate ? activity.filter((i) => i.date === filterDate) : activity;
  const unseenCount = Math.max(0, activity.length - Number(lastSeenAt));
  async function openBatch(batchId?: string) {
    if (!batchId) return;
    const batch = batches.find((b) => b.id === batchId);
    if (!batch) return;
    const logs = await getBatchLogs(batchId);
    setPreviewLogs(logs);
    setPreviewBatch(batch);
    setNotifOpen(false);
    setAllOpen(false);
  }

  return (
    <div className="grain-shell min-h-screen">
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        {!hideHeader && (
          <header className="mb-6 border border-[var(--border)] bg-[var(--surface-strong)]">
            <div className="flex items-center justify-between px-5 py-4">
              <Link href="/" className="group">
                <p className="text-xs uppercase tracking-[0.3em] text-muted">Brewery Ops</p>
                <h1 className="mt-1 text-2xl font-semibold text-ink group-hover:text-[var(--accent)] transition">Brewing Tracker</h1>
              </Link>
              <div className="flex items-center gap-2">

                {/* Calendar button */}
                <Link
                  href="/calendar"
                  className="flex h-10 w-10 items-center justify-center border border-[var(--border)] bg-[var(--surface)] text-muted transition hover:bg-[var(--surface-strong)] hover:text-ink"
                  aria-label="Production calendar"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </Link>

                {/* Notification bell */}
                <div className="relative" ref={notifRef}>
                  <button
                    type="button"
                    onClick={() => { setNotifOpen((o) => { if (!o) { setLastSeenAt(String(activity.length)); try { localStorage.setItem("notif-last-seen", String(activity.length)); } catch {} } return !o; }); setMenuOpen(false); }}
                    className="relative flex h-10 w-10 items-center justify-center border border-[var(--border)] bg-[var(--surface)] text-muted transition hover:bg-[var(--surface-strong)] hover:text-ink"
                    aria-label="Activity"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unseenCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent)] text-[10px] font-bold text-white">
                        {unseenCount > 9 ? "9+" : unseenCount}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <div className="absolute right-0 top-full z-50 mt-1 w-80 border border-[var(--border)] bg-[var(--surface-strong)] shadow-sm">
                      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
                        <p className="text-sm font-semibold text-ink">Recent activity</p>
                        <button
                          type="button"
                          onClick={() => { setAllOpen(true); setNotifOpen(false); }}
                          className="text-xs text-muted underline-offset-2 hover:underline hover:text-ink transition"
                        >
                          View all
                        </button>
                      </div>
                      <div className="divide-y divide-[var(--border)]">
                        {preview.length === 0 ? (
                          <p className="px-4 py-4 text-sm text-muted">No activity today or yesterday.</p>
                        ) : preview.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => openBatch(item.batchId)}
                            className={`w-full px-4 py-3 text-left transition ${item.batchId ? "hover:bg-[var(--background)] cursor-pointer" : "cursor-default"}`}
                          >
                            <p className="text-xs text-muted">{formatDate(item.date)} · {item.title}</p>
                            <p className="mt-0.5 text-sm">{item.detail}</p>
                          </button>
                        ))}
                      </div>
                      {activity.length > PREVIEW_LIMIT && (
                        <div className="border-t border-[var(--border)] px-4 py-2">
                          <button
                            type="button"
                            onClick={() => { setAllOpen(true); setNotifOpen(false); }}
                            className="text-xs text-muted underline-offset-2 hover:underline"
                          >
                            +{activity.length - PREVIEW_LIMIT} more
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* User dropdown */}
                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => { setMenuOpen((o) => !o); setNotifOpen(false); }}
                    className="flex items-center gap-3 border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-left text-sm transition hover:bg-[var(--surface-strong)]"
                  >
                    <div className="flex h-8 w-8 items-center justify-center bg-[var(--accent)] text-sm font-semibold text-white">
                      {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "?"}
                    </div>
                    <div>
                      <p className="font-semibold text-ink">{currentUser.name || "—"}</p>
                      <p className="text-xs text-muted">{currentUser.role}</p>
                    </div>
                    <svg className={`ml-1 h-4 w-4 text-muted transition-transform ${menuOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 top-full z-50 mt-1 w-52 border border-[var(--border)] bg-[var(--surface-strong)] shadow-sm">
                      <div className="border-b border-[var(--border)] px-4 py-3">
                        <p className="text-sm font-semibold text-ink">{currentUser.name}</p>
                        {currentUser.email && <p className="mt-0.5 text-xs text-muted">{currentUser.email}</p>}
                      </div>
                      <div className="py-1">
                        <button
                          type="button"
                          onClick={toggle}
                          className="w-full px-4 py-2 text-left text-sm text-ink transition hover:bg-[var(--background)] flex items-center justify-between"
                        >
                          <span>Appearance</span>
                          <span className="text-xs text-muted">{theme === "dark" ? "🌙 Dark" : "☀️ Light"}</span>
                        </button>
                      </div>
                      {isAdmin && (
                        <>
                          <div className="border-t border-[var(--border)] px-4 py-2">
                            <p className="text-xs uppercase tracking-[0.15em] text-muted">Admin</p>
                          </div>
                          <div className="py-1">
                            {([
                              { href: "/admin/beers", label: "Beer catalog" },
                              { href: "/admin/tanks", label: "Tanks" },
                              { href: "/admin/inventory", label: "Inventory" },
                              { href: "/admin/recipes", label: "Recipes" },
                              { href: "/admin/users", label: "Users" },
                              { href: "/admin/reports", label: "Reports" }
                            ] as { href: import("next").Route; label: string }[]).map((item) => (
                              <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMenuOpen(false)}
                                className="block px-4 py-2 text-sm text-ink transition hover:bg-[var(--background)]"
                              >
                                {item.label}
                              </Link>
                            ))}
                          </div>
                        </>
                      )}
                      <div className="border-t border-[var(--border)] py-1">
                        <form action={signOut}>
                          <button type="submit" className="w-full px-4 py-2 text-left text-sm text-ink transition hover:bg-[var(--background)]">
                            Sign out
                          </button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>
        )}

        <main>{children}</main>
      </div>

      {/* Batch preview (read-only) */}
      <Dialog
        title={previewBatch ? `${previewBatch.beerName} — ${previewBatch.batchNumber}` : ""}
        open={!!previewBatch}
        onClose={() => { setPreviewBatch(null); setPreviewLogs([]); }}
      >
        {previewBatch && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {(["Planned","Brewing","Fermenting","Conditioning","Packaging","Completed"] as const).map((s, i, arr) => {
                const currentIdx = arr.indexOf(previewBatch.stage);
                const isPast = i < currentIdx;
                const isCurrent = s === previewBatch.stage;
                return (
                  <span key={s} className={`pill ${isCurrent ? stageTone(s) : isPast ? "pill-success opacity-60" : "pill-neutral opacity-30"}`}>{s}</span>
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-3 border border-[var(--border)] bg-[var(--background)] p-4 text-sm sm:grid-cols-4">
              <div><p className="text-muted">Style</p><p className="mt-1 font-semibold">{previewBatch.style}</p></div>
              <div><p className="text-muted">Brew date</p><p className="mt-1 font-semibold">{formatDate(previewBatch.actualBrewDate ?? previewBatch.plannedBrewDate)}</p></div>
              <div><p className="text-muted">Est. done</p><p className="mt-1 font-semibold">{formatDate(previewBatch.plannedEndDate)}</p></div>
              <div><p className="text-muted">Volume</p><p className="mt-1 font-semibold">{previewBatch.actualVolumeBbl ?? previewBatch.targetVolumeBbl} bbl</p></div>
              <div><p className="text-muted">OG</p><p className="mt-1 font-semibold">{previewBatch.og ?? "—"}</p></div>
              <div><p className="text-muted">FG</p><p className="mt-1 font-semibold">{previewBatch.fg ?? "—"}</p></div>
              <div><p className="text-muted">ABV</p><p className="mt-1 font-semibold">{previewBatch.abv ? `${previewBatch.abv}%` : "—"}</p></div>
              <div><p className="text-muted">IBU</p><p className="mt-1 font-semibold">{previewBatch.ibu ?? "—"}</p></div>
            </div>
            {previewBatch.notes && (
              <p className="text-sm text-muted">{previewBatch.notes}</p>
            )}
            {previewLogs.length > 0 && (
              <div>
                <p className="mb-3 text-xs uppercase tracking-[0.15em] text-muted">Production log</p>
                <div className="space-y-0">
                  {previewLogs.map((log, i) => (
                    <div key={log.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-[var(--accent)]" />
                        {i < previewLogs.length - 1 && <div className="w-px flex-1 bg-[var(--border)]" />}
                      </div>
                      <div className="pb-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`pill text-xs ${stageTone(log.stage)}`}>{log.stage}</span>
                          <span className="text-xs text-muted">{formatDate(log.createdAt.slice(0, 10))}</span>
                          <span className="text-xs text-muted">by {log.createdBy}</span>
                        </div>
                        {log.note && <p className="mt-2 text-sm leading-6">{log.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button type="button" onClick={() => { setPreviewBatch(null); setPreviewLogs([]); }} className="button-secondary w-full">Close</button>
          </div>
        )}
      </Dialog>

      {/* Full activity dialog */}
      <Dialog title="Activity log" open={allOpen} onClose={() => setAllOpen(false)}>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="text-sm text-muted shrink-0">Filter by date</label>
            <input type="date" className="input-shell" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
            {filterDate && (
              <button type="button" onClick={() => setFilterDate("")} className="text-sm text-muted underline-offset-2 hover:underline shrink-0">Clear</button>
            )}
          </div>
          <div className="divide-y divide-[var(--border)]">
            {filtered.length === 0 ? (
              <p className="py-4 text-sm text-muted">No activity found.</p>
            ) : filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => openBatch(item.batchId)}
                className={`w-full py-4 text-left border-b border-[var(--border)] last:border-0 transition ${item.batchId ? "hover:opacity-70 cursor-pointer" : "cursor-default"}`}
              >
                <p className="text-xs uppercase tracking-[0.2em] text-muted">{formatDate(item.date)}</p>
                <p className="mt-2 font-semibold">{item.title}</p>
                <p className="mt-1 text-sm leading-6 text-muted">{item.detail}</p>
              </button>
            ))}
          </div>
        </div>
      </Dialog>
    </div>
  );
}
