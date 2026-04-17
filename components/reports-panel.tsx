"use client";

import { Batch, Beer, InventoryItem, Tank } from "@/lib/types";
import { SectionCard } from "@/components/ui";
import {
  batchesByMonth,
  cycleTimeRows,
  inventoryHealthRows,
  packagingByMonth,
  packagingRows,
  productionEfficiencyRows,
  productionEfficiencySummary,
  qualityRows,
  tankUtilizationRows
} from "@/lib/reports";

// ─── CSV export ───────────────────────────────────────────────────────────────

function exportCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      headers.map((h) => {
        const v = r[h] ?? "";
        const s = String(v);
        return s.includes(",") ? `"${s}"` : s;
      }).join(",")
    )
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function ExportButton({ label, rows }: { label: string; rows: Record<string, unknown>[] }) {
  return (
    <button
      onClick={() => exportCsv(label, rows)}
      disabled={!rows.length}
      className="text-xs uppercase tracking-[0.15em] text-[var(--accent)] hover:underline disabled:opacity-30"
    >
      Export CSV
    </button>
  );
}

// ─── Shared display helpers ───────────────────────────────────────────────────

function fmt(v: number | null, decimals = 1): string {
  return v == null ? "—" : v.toFixed(decimals);
}

function StatGrid({ stats }: { stats: { label: string; value: string | number }[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {stats.map(({ label, value }) => (
        <div key={label} className="border border-[var(--border)] p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
        </div>
      ))}
    </div>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: (string | number | null)[][] }) {
  if (!rows.length) return <p className="py-4 text-sm text-muted">No data available.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)]">
            {headers.map((h) => (
              <th key={h} className="pb-2 pr-4 text-left text-xs uppercase tracking-[0.15em] text-muted font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className="py-2.5 pr-4 tabular-nums">
                  {cell ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ReportsPanel({
  batches,
  beers,
  tanks,
  inventory
}: {
  batches: Batch[];
  beers: Beer[];
  tanks: Tank[];
  inventory: InventoryItem[];
}) {
  const effRows = productionEfficiencyRows(batches);
  const effSummary = productionEfficiencySummary(batches);
  const cycleRows = cycleTimeRows(batches);
  const qualRows = qualityRows(batches, beers);
  const pkgRows = packagingRows(batches);
  const pkgByMonth = packagingByMonth(batches);
  const tankRows = tankUtilizationRows(tanks, batches);
  const invRows = inventoryHealthRows(inventory);
  const brewsByMonth = batchesByMonth(batches);

  const avgCycle = cycleRows.length
    ? Math.round(cycleRows.reduce((s, r) => s + r.cycleDays, 0) / cycleRows.length)
    : null;

  return (
    <div className="space-y-6">

      {/* Production efficiency */}
      <SectionCard
        title="Production efficiency"
        subtitle="Planned vs actual volume per batch"
        action={<ExportButton label="production-efficiency" rows={effRows as unknown as Record<string, unknown>[]} />}
      >
        <StatGrid stats={[
          { label: "Avg yield", value: effSummary.avgYieldPct != null ? `${effSummary.avgYieldPct.toFixed(1)}%` : "—" },
          { label: "Target bbl", value: effSummary.totalTargetBbl.toFixed(1) },
          { label: "Actual bbl", value: effSummary.totalActualBbl.toFixed(1) },
          { label: "Batches tracked", value: effRows.length }
        ]} />
        <div className="mt-4">
          <Table
            headers={["Batch", "Beer", "Target bbl", "Actual bbl", "Yield %"]}
            rows={effRows.map((r) => [r.batch, r.beer, r.targetBbl, r.actualBbl, `${r.yieldPct}%`])}
          />
        </div>
      </SectionCard>

      {/* Batch cycle time */}
      <SectionCard
        title="Batch cycle time"
        subtitle="Brew date to package date"
        action={<ExportButton label="cycle-time" rows={cycleRows as unknown as Record<string, unknown>[]} />}
      >
        <StatGrid stats={[
          { label: "Avg cycle days", value: avgCycle ?? "—" },
          { label: "Fastest (days)", value: cycleRows.length ? Math.min(...cycleRows.map((r) => r.cycleDays)) : "—" },
          { label: "Slowest (days)", value: cycleRows.length ? Math.max(...cycleRows.map((r) => r.cycleDays)) : "—" },
          { label: "Batches tracked", value: cycleRows.length }
        ]} />
        <div className="mt-4">
          <Table
            headers={["Batch", "Beer", "Brew date", "Package date", "Days"]}
            rows={cycleRows.map((r) => [r.batch, r.beer, r.brewDate, r.packageDate, r.cycleDays])}
          />
        </div>
      </SectionCard>

      {/* Quality metrics */}
      <SectionCard
        title="Quality metrics"
        subtitle="Actual vs target OG / FG / ABV per completed batch"
        action={<ExportButton label="quality-metrics" rows={qualRows as unknown as Record<string, unknown>[]} />}
      >
        <Table
          headers={["Batch", "Beer", "OG", "Target OG", "FG", "Target FG", "ABV", "Target ABV", "ABV Δ", "Attenuation"]}
          rows={qualRows.map((r) => [
            r.batch, r.beer,
            fmt(r.actualOg, 3), fmt(r.targetOg, 3),
            fmt(r.actualFg, 3), fmt(r.targetFg, 3),
            fmt(r.actualAbv), fmt(r.targetAbv),
            r.abvDelta != null ? (r.abvDelta > 0 ? `+${r.abvDelta}` : String(r.abvDelta)) : "—",
            r.attenuation != null ? `${r.attenuation}%` : "—"
          ])}
        />
      </SectionCard>

      {/* Packaging breakdown */}
      <SectionCard
        title="Packaging breakdown"
        subtitle="Completed batches by type and month"
        action={<ExportButton label="packaging" rows={pkgRows as unknown as Record<string, unknown>[]} />}
      >
        <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {(["Keg", "Can"] as const).map((type) => {
            const subset = pkgRows.filter((r) => r.packageType === type);
            return (
              <div key={type} className="border border-[var(--border)] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted">{type}</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight">{subset.length}</p>
                <p className="mt-1 text-sm text-muted">
                  {subset.reduce((s, r) => s + r.packagedUnits, 0)} units
                </p>
              </div>
            );
          })}
          <div className="border border-[var(--border)] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Batches / month (avg)</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">
              {pkgByMonth.length
                ? (pkgByMonth.reduce((s, r) => s + r.count, 0) / pkgByMonth.length).toFixed(1)
                : "—"}
            </p>
          </div>
        </div>
        <Table
          headers={["Month", "Batches packaged"]}
          rows={pkgByMonth.map((r) => [r.month, r.count])}
        />
      </SectionCard>

      {/* Tank utilization */}
      <SectionCard
        title="Tank utilization"
        subtitle="Occupancy and batch history per vessel"
        action={<ExportButton label="tank-utilization" rows={tankRows as unknown as Record<string, unknown>[]} />}
      >
        <Table
          headers={["Tank", "Type", "Capacity (bbl)", "Status", "Batches run", "Days occupied", "Last CIP"]}
          rows={tankRows.map((r) => [r.tank, r.type, r.capacityBbl, r.status, r.batchCount, r.totalDaysOccupied, r.lastCip])}
        />
      </SectionCard>

      {/* Inventory health */}
      <SectionCard
        title="Inventory health"
        subtitle="Current stock levels vs reorder thresholds"
        action={<ExportButton label="inventory-health" rows={invRows as unknown as Record<string, unknown>[]} />}
      >
        <Table
          headers={["Item", "Category", "On hand", "Unit", "Reorder at", "Supplier", "Status"]}
          rows={invRows.map((r) => [r.name, r.category, r.onHand, r.unit, r.reorderThreshold, r.supplier, r.status])}
        />
      </SectionCard>

      {/* Batches brewed by month */}
      <SectionCard
        title="Batches brewed by month"
        subtitle="Production volume over time"
        action={<ExportButton label="batches-by-month" rows={brewsByMonth as unknown as Record<string, unknown>[]} />}
      >
        {brewsByMonth.length === 0 ? (
          <p className="py-4 text-sm text-muted">No brew dates recorded yet.</p>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {brewsByMonth.map(({ month, count }) => (
              <div key={month} className="flex items-center justify-between py-3">
                <span className="text-sm font-medium">{month}</span>
                <div className="flex items-center gap-3">
                  <div
                    className="h-2 rounded-full bg-[var(--accent)] opacity-70"
                    style={{ width: `${Math.max(count * 20, 8)}px` }}
                  />
                  <span className="w-6 text-right text-sm tabular-nums text-muted">{count}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

    </div>
  );
}
