"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

const sections: Array<{ href: Route; label: string; description: string }> = [
  {
    href: "/admin/users",
    label: "Users",
    description: "Manage admins and general users."
  },
  {
    href: "/admin/beers",
    label: "Beers",
    description: "Define the brewery's beer catalog."
  },
  {
    href: "/admin/tanks",
    label: "Tanks",
    description: "Maintain the vessel roster and availability."
  },
  {
    href: "/admin/inventory",
    label: "Inventory",
    description: "Manage ingredients and packaging stock."
  },
  {
    href: "/admin/reports",
    label: "Reports",
    description: "Production summaries, batch metrics, and inventory health."
  }
];

export function AdminSectionNav() {
  const pathname = usePathname();

  return (
    <section className="panel p-5 sm:p-6">
      <div className="mb-5 border-b border-[var(--border)] pb-4">
        <h3 className="text-xl font-semibold tracking-[-0.01em]">Admin areas</h3>
      </div>
      <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-5">
        {sections.map((section) => {
          const active = pathname === section.href;

          return (
            <Link
              key={section.href}
              href={section.href}
              className={`border px-4 py-3 transition ${
                active
                  ? "border-[var(--accent)] bg-[rgba(164,77,29,0.08)]"
                  : "border-[var(--border)] bg-white/50 hover:bg-white/80"
              }`}
            >
              <p className="text-sm font-semibold">{section.label}</p>
              <p className="mt-1 text-xs leading-5 text-muted">{section.description}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
