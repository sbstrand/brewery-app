"use client";

import { useRouter } from "next/navigation";
import { BatchCalendar } from "@/components/batch-calendar";
import { Batch, Tank } from "@/lib/types";

export function BatchCalendarPage({ batches, tanks }: { batches: Batch[]; tanks: Tank[] }) {
  const router = useRouter();
  return <BatchCalendar batches={batches} tanks={tanks} onClose={() => router.back()} />;
}
