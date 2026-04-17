"use client";

import Link from "next/link";
import { ReactNode, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { useTheme } from "@/components/theme-provider";
import { signOut } from "@/app/actions/auth";

const NO_HEADER_PATHS = ["/login", "/reset-password"];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { currentUser, isAdmin } = useAuth();
  const { theme, toggle } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const hideHeader = NO_HEADER_PATHS.some((p) => pathname.startsWith(p));

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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

              {/* User dropdown */}
              <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
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
                        {[
                          { href: "/admin/beers", label: "Beer catalog" },
                          { href: "/admin/tanks", label: "Tanks" },
                          { href: "/admin/inventory", label: "Inventory" },
                          { href: "/admin/users", label: "Users" }
                        ].map((item) => (
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
            </div>{/* end user dropdown */}
            </div>{/* end header right */}
          </div>
        </header>
        )}

        <main>{children}</main>
      </div>
    </div>
  );
}
