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
  }
];

export function AdminSectionNav() {
  const pathname = usePathname();

  return (
    <section className="panel p-5 sm:p-6">
      <div className="mb-5 border-b border-[var(--border)] pb-4">
        <h3 className="text-xl font-semibold tracking-[-0.01em]">Admin areas</h3>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {sections.map((section) => {
          const active = pathname === section.href;

          return (
            <Link
              key={section.href}
              href={section.href}
              className={`border p-4 transition ${
                active
                  ? "border-[var(--accent)] bg-[rgba(164,77,29,0.08)]"
                  : "border-[var(--border)] bg-white/50 hover:bg-white/80"
              }`}
            >
              <p className="text-lg font-semibold">{section.label}</p>
              <p className="mt-2 text-sm leading-6 text-muted">{section.description}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
