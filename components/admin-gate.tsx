"use client";

import { ReactNode } from "react";
import { useAuth } from "@/components/auth-provider";

export function AdminGate({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <section className="panel rounded-[1.75rem] p-6">
        <h3 className="text-xl font-semibold">Admin access only</h3>
        <p className="mt-3 text-sm leading-7 text-muted">
          This area is limited to admin users. General users can continue tracking the brewing process from
          the dashboard and batches page.
        </p>
      </section>
    );
  }

  return <>{children}</>;
}
