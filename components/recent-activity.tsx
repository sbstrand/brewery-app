"use client";

import { useMemo, useState } from "react";
import { Dialog } from "@/components/dialog";
import { Activity } from "@/lib/types";
import { formatDate } from "@/lib/utils";

function today() { return new Date().toISOString().slice(0, 10); }
function yesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

const PREVIEW_LIMIT = 4;

function ActivityList({ items }: { items: Activity[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted">No activity for this date.</p>;
  }
  return (
    <div className="space-y-0">
      {items.map((item, i) => (
        <div key={item.id} className={`pb-4 ${i < items.length - 1 ? "border-b border-[var(--border)] mb-4" : ""}`}>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">{formatDate(item.date)}</p>
          <p className="mt-2 font-semibold">{item.title}</p>
          <p className="mt-1 text-sm leading-6 text-muted">{item.detail}</p>
        </div>
      ))}
    </div>
  );
}

export function RecentActivityPanel({
  items,
  open,
  onOpen,
  onClose
}: {
  items: Activity[];
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const [filterDate, setFilterDate] = useState("");

  const todayStr = today();
  const yesterdayStr = yesterday();

  const preview = useMemo(
    () => items
      .filter((i) => i.date === todayStr || i.date === yesterdayStr)
      .slice(0, PREVIEW_LIMIT),
    [items, todayStr, yesterdayStr]
  );

  const filtered = useMemo(() => {
    if (!filterDate) return items;
    return items.filter((i) => i.date === filterDate);
  }, [items, filterDate]);

  const totalCount = items.filter((i) => i.date === todayStr || i.date === yesterdayStr).length;
  const extra = totalCount - PREVIEW_LIMIT;

  return (
    <>
      {preview.length === 0 ? (
        <p className="text-sm text-muted">No activity today or yesterday.</p>
      ) : (
        <ActivityList items={preview} />
      )}

      {extra > 0 && (
        <button type="button" onClick={onOpen} className="mt-3 text-xs text-muted underline-offset-2 hover:underline">
          +{extra} more
        </button>
      )}

      <Dialog title="Activity log" open={open} onClose={onClose}>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="text-sm text-muted shrink-0">Filter by date</label>
            <input type="date" className="input-shell" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
            {filterDate && (
              <button type="button" onClick={() => setFilterDate("")} className="text-sm text-muted underline-offset-2 hover:underline shrink-0">
                Clear
              </button>
            )}
          </div>
          <ActivityList items={filtered} />
        </div>
      </Dialog>
    </>
  );
}
