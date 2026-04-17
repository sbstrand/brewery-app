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
    href: "/admin/recipes",
    label: "Recipes",
    description: "Associate ingredient lists with beers."
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
      <div className="mb-4 border-b border-[var(--border)] pb-3">
        <h3 className="text-base font-semibold tracking-[-0.01em]">Admin areas</h3>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {sections.map((section) => {
          const active = pathname === section.href;
          return (
            <Link
              key={section.href}
              href={section.href}
              className={`border px-3 py-1.5 text-sm font-medium transition ${
                active
                  ? "border-[var(--accent)] bg-[rgba(164,77,29,0.08)] text-[var(--accent)]"
                  : "border-[var(--border)] bg-white/50 text-ink hover:bg-white/80"
              }`}
            >
              {section.label}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
