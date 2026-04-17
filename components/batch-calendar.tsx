"use client";

import { useMemo, useState } from "react";
import { Dialog } from "@/components/dialog";
import { Batch, Tank } from "@/lib/types";
import { deriveTankStatus, formatDate, stageTone, tankTone } from "@/lib/utils";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const BAR_COLORS = [
  { bg: "#2563eb", border: "#1d4ed8", text: "#ffffff" },   // blue
  { bg: "#059669", border: "#047857", text: "#ffffff" },   // emerald
  { bg: "#dc2626", border: "#b91c1c", text: "#ffffff" },   // red
  { bg: "#7c3aed", border: "#6d28d9", text: "#ffffff" },   // purple
  { bg: "#c9a84c", border: "#a8872e", text: "#13141a" },   // gold (3 Nations accent)
  { bg: "#db2777", border: "#be185d", text: "#ffffff" },   // pink
];

function toDate(str: string) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function isoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function addDays(date: Date, n: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

const BAR_HEIGHT = 22;
const BAR_GAP = 4;
const DAY_NUMBER_HEIGHT = 28;

export function BatchCalendar({
  batches,
  tanks,
  onClose
}: {
  batches: Batch[];
  tanks: Tank[];
  onClose: () => void;
}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - firstDay.getDay());

  const gridEnd = new Date(lastDay);
  gridEnd.setDate(lastDay.getDate() + (6 - lastDay.getDay()));

  const weeks: Date[][] = [];
  let cursor = new Date(gridStart);
  while (cursor <= gridEnd) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(cursor));
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
  }

  const batchColorMap = useMemo(() => {
    const map = new Map<string, number>();
    batches.forEach((b, i) => map.set(b.id, i % BAR_COLORS.length));
    return map;
  }, [batches]);

  function getBatchRowsForWeek(week: Date[]) {
    const weekStart = week[0];
    const weekEnd = week[6];

    return batches
      .filter((b) => {
        const start = toDate(b.plannedBrewDate);
        const end = b.plannedEndDate ? toDate(b.plannedEndDate) : start;
        return start <= weekEnd && end >= weekStart;
      })
      .map((b, rowIndex) => {
        const bStart = toDate(b.plannedBrewDate);
        const bEnd = b.plannedEndDate ? toDate(b.plannedEndDate) : bStart;
        const colStart = Math.max(0, Math.round((bStart.getTime() - weekStart.getTime()) / 86400000));
        const colEnd = Math.min(6, Math.round((bEnd.getTime() - weekStart.getTime()) / 86400000));
        const startsThisWeek = bStart >= weekStart;
        const endsThisWeek = bEnd <= weekEnd;
        return { batch: b, colStart, colEnd, startsThisWeek, endsThisWeek, rowIndex };
      });
  }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  const monthLabel = new Date(year, month, 1).toLocaleString("default", { month: "long", year: "numeric" });
  const activeBatches = batches.filter((b) => b.stage !== "Completed");

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--background)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface-strong)] px-6 py-4">
        <div className="flex items-center gap-4">
          <button type="button" onClick={onClose} className="text-muted transition hover:text-ink" aria-label="Close">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h2 className="text-xl font-semibold">Production calendar</h2>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={prevMonth} className="button-secondary px-3 py-1.5 text-sm">‹</button>
          <span className="min-w-[10rem] text-center font-semibold">{monthLabel}</span>
          <button type="button" onClick={nextMonth} className="button-secondary px-3 py-1.5 text-sm">›</button>
          <button type="button" onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); }} className="button-secondary px-3 py-1.5 text-sm">Today</button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-[640px]">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-[var(--border)] bg-[var(--surface-strong)]">
            {DAYS.map((d) => (
              <div key={d} className="py-2 text-center text-xs uppercase tracking-[0.1em] text-muted">{d}</div>
            ))}
          </div>

          {/* Week rows */}
          {weeks.map((week, wi) => {
            const batchRows = getBatchRowsForWeek(week);
            const minHeight = DAY_NUMBER_HEIGHT + (batchRows.length * (BAR_HEIGHT + BAR_GAP)) + BAR_GAP + 8;

            return (
              <div
                key={wi}
                className="relative grid grid-cols-7 border-b border-[var(--border)]"
                style={{ minHeight }}
              >
                {/* Day cells */}
                {week.map((day, di) => {
                  const isToday = isoDate(day) === isoDate(today);
                  const inMonth = day.getMonth() === month;
                  return (
                    <div
                      key={di}
                      className={`border-r border-[var(--border)] p-1.5 last:border-r-0 ${!inMonth ? "bg-[var(--surface-contrast)]" : "bg-[var(--surface)]"}`}
                    >
                      <span className={`inline-flex h-6 w-6 items-center justify-center text-xs font-semibold ${
                        isToday
                          ? "rounded-full bg-[var(--accent)] text-white"
                          : inMonth ? "text-ink" : "text-muted opacity-40"
                      }`}>
                        {day.getDate()}
                      </span>
                    </div>
                  );
                })}

                {/* Batch bars — absolutely positioned inside the row */}
                {batchRows.map(({ batch, colStart, colEnd, startsThisWeek, endsThisWeek, rowIndex }) => {
                  const color = BAR_COLORS[batchColorMap.get(batch.id) ?? 0];
                  const top = DAY_NUMBER_HEIGHT + rowIndex * (BAR_HEIGHT + BAR_GAP);
                  const leftPct = (colStart / 7) * 100;
                  const widthPct = ((colEnd - colStart + 1) / 7) * 100;
                  const tank = tanks.find((t) => t.id === batch.assignedTankId);
                  const label = [tank?.name, batch.beerName, batch.batchNumber].filter(Boolean).join(" · ");

                  return (
                    <div
                      key={batch.id}
                      title={`${batch.beerName} (${batch.batchNumber}) · ${batch.stage}${tank ? ` · ${tank.name}` : ""}`}
                      onClick={() => setSelectedBatch(batch)}
                      className={`absolute flex cursor-pointer items-center justify-center overflow-hidden px-2 text-xs font-semibold transition-opacity hover:opacity-80 ${startsThisWeek ? "rounded-l" : ""} ${endsThisWeek ? "rounded-r" : ""}`}
                      style={{
                        top,
                        left: `calc(${leftPct}% + 2px)`,
                        width: `calc(${widthPct}% - 4px)`,
                        height: BAR_HEIGHT,
                        background: color.bg,
                        border: `1px solid ${color.border}`,
                        color: color.text,
                      }}
                    >
                      <span className="truncate text-center">{label}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="border-t border-[var(--border)] bg-[var(--surface-strong)] px-6 py-3">
        <div className="flex flex-wrap gap-3">
          {activeBatches.length === 0 ? (
            <p className="text-sm text-muted">No active batches.</p>
          ) : activeBatches.map((b) => {
            const color = BAR_COLORS[batchColorMap.get(b.id) ?? 0];
            return (
              <div key={b.id} className="flex items-center gap-1.5 text-xs">
                <span className="inline-block h-3 w-3 rounded-sm border" style={{ background: color.bg, borderColor: color.border }} />
                <span className="text-muted">{b.beerName} ({b.batchNumber})</span>
                <span className={`pill text-xs ${stageTone(b.stage)}`}>{b.stage}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Batch detail dialog (read-only) */}
      {selectedBatch && (() => {
        const b = selectedBatch;
        const tank = tanks.find((t) => t.id === b.assignedTankId);
        const tankStatus = tank ? deriveTankStatus(tank, [b]) : null;
        return (
          <Dialog title={`${b.beerName} — ${b.batchNumber}`} open onClose={() => setSelectedBatch(null)}>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className={`pill ${stageTone(b.stage)}`}>{b.stage}</span>
                {tankStatus && <span className={`pill ${tankTone(tankStatus)}`}>{tank?.name}</span>}
              </div>

              <div className="grid grid-cols-2 gap-3 border border-[var(--border)] bg-[var(--background)] p-4 text-sm sm:grid-cols-3">
                <div><p className="text-muted">Style</p><p className="mt-1 font-semibold">{b.style}</p></div>
                <div><p className="text-muted">Brew date</p><p className="mt-1 font-semibold">{formatDate(b.actualBrewDate ?? b.plannedBrewDate)}</p></div>
                <div><p className="text-muted">Est. done</p><p className="mt-1 font-semibold">{formatDate(b.plannedEndDate)}</p></div>
                <div><p className="text-muted">Volume</p><p className="mt-1 font-semibold">{b.actualVolumeBbl ?? b.targetVolumeBbl} bbl</p></div>
                <div><p className="text-muted">Package</p><p className="mt-1 font-semibold">{b.packageType ?? "—"}</p></div>
                <div><p className="text-muted">Tank</p><p className="mt-1 font-semibold">{tank?.name ?? "Unassigned"}</p></div>
                <div><p className="text-muted">OG</p><p className="mt-1 font-semibold">{b.og ?? "—"}</p></div>
                <div><p className="text-muted">FG</p><p className="mt-1 font-semibold">{b.fg ?? "—"}</p></div>
                <div><p className="text-muted">ABV</p><p className="mt-1 font-semibold">{b.abv ? `${b.abv}%` : "—"}</p></div>
                <div><p className="text-muted">IBU</p><p className="mt-1 font-semibold">{b.ibu ?? "—"}</p></div>
                {b.packagedUnits && <div><p className="text-muted">Packaged units</p><p className="mt-1 font-semibold">{b.packagedUnits}</p></div>}
              </div>

              {b.notes && (
                <div>
                  <p className="mb-1 text-sm text-muted">Notes</p>
                  <p className="text-sm leading-6">{b.notes}</p>
                </div>
              )}

              <button type="button" onClick={() => setSelectedBatch(null)} className="button-secondary w-full">Close</button>
            </div>
          </Dialog>
        );
      })()}
    </div>
  );
}
