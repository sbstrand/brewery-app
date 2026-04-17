import { Batch, Beer, InventoryItem, Tank } from "@/lib/types";
import { deriveTankStatus, inventoryHealth } from "@/lib/utils";

function avgNum(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

// ─── Production efficiency ────────────────────────────────────────────────────

export function productionEfficiencyRows(batches: Batch[]) {
  return batches
    .filter((b) => b.actualVolumeBbl != null)
    .map((b) => {
      const yieldPct = ((b.actualVolumeBbl! / b.targetVolumeBbl) * 100).toFixed(1);
      return {
        batch: b.batchNumber,
        beer: b.beerName,
        targetBbl: b.targetVolumeBbl,
        actualBbl: b.actualVolumeBbl!,
        yieldPct: Number(yieldPct)
      };
    });
}

export function productionEfficiencySummary(batches: Batch[]) {
  const rows = productionEfficiencyRows(batches);
  return {
    avgYieldPct: avgNum(rows.map((r) => r.yieldPct)),
    totalTargetBbl: rows.reduce((s, r) => s + r.targetBbl, 0),
    totalActualBbl: rows.reduce((s, r) => s + r.actualBbl, 0)
  };
}

// ─── Batch cycle time ─────────────────────────────────────────────────────────

export function cycleTimeRows(batches: Batch[]) {
  return batches
    .filter((b) => b.actualBrewDate && b.packageDate)
    .map((b) => ({
      batch: b.batchNumber,
      beer: b.beerName,
      brewDate: b.actualBrewDate!,
      packageDate: b.packageDate!,
      cycleDays: daysBetween(b.actualBrewDate!, b.packageDate!)
    }));
}

// ─── Quality metrics ──────────────────────────────────────────────────────────

export function qualityRows(batches: Batch[], beers: Beer[]) {
  const beerMap = new Map(beers.map((b) => [b.id, b]));
  return batches
    .filter((b) => b.stage === "Completed" && b.beerId)
    .map((b) => {
      const beer = beerMap.get(b.beerId!);
      return {
        batch: b.batchNumber,
        beer: b.beerName,
        actualAbv: b.abv ?? null,
        targetAbv: beer?.targetAbv ?? null,
        abvDelta: b.abv != null && beer?.targetAbv != null ? +(b.abv - beer.targetAbv).toFixed(2) : null,
        actualOg: b.og ?? null,
        targetOg: beer?.targetOg ?? null,
        actualFg: b.fg ?? null,
        targetFg: beer?.targetFg ?? null,
        attenuation:
          b.og != null && b.fg != null
            ? +(((b.og - b.fg) / (b.og - 1)) * 100).toFixed(1)
            : null
      };
    });
}

// ─── Packaging ────────────────────────────────────────────────────────────────

export function packagingRows(batches: Batch[]) {
  return batches
    .filter((b) => b.stage === "Completed" && b.packageType)
    .map((b) => ({
      batch: b.batchNumber,
      beer: b.beerName,
      packageType: b.packageType!,
      packageDate: b.packageDate ?? "",
      packagedUnits: b.packagedUnits ?? 0,
      actualBbl: b.actualVolumeBbl ?? b.targetVolumeBbl,
      packagingYieldPct:
        b.packagedUnits != null && b.actualVolumeBbl != null && b.actualVolumeBbl > 0
          ? +((b.packagedUnits / (b.actualVolumeBbl * 31)).toFixed(1)) // approx gal/bbl
          : null
    }));
}

export function packagingByMonth(batches: Batch[]) {
  const map = new Map<string, number>();
  batches
    .filter((b) => b.packageDate)
    .forEach((b) => {
      const month = b.packageDate!.slice(0, 7);
      map.set(month, (map.get(month) ?? 0) + 1);
    });
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));
}

// ─── Tank utilization ─────────────────────────────────────────────────────────

export function tankUtilizationRows(tanks: Tank[], batches: Batch[]) {
  return tanks.map((tank) => {
    const tankBatches = batches.filter((b) => b.assignedTankId === tank.id && b.actualBrewDate);
    const totalDaysOccupied = tankBatches.reduce((sum, b) => {
      const end = b.packageDate ?? b.updatedAt ?? new Date().toISOString().slice(0, 10);
      return sum + daysBetween(b.actualBrewDate!, end);
    }, 0);
    return {
      tank: tank.name,
      type: tank.type,
      capacityBbl: tank.capacityBbl,
      status: deriveTankStatus(tank, batches),
      batchCount: tankBatches.length,
      totalDaysOccupied,
      lastCip: tank.lastCipDate
    };
  });
}

// ─── Inventory health ─────────────────────────────────────────────────────────

export function inventoryHealthRows(inventory: InventoryItem[]) {
  return inventory.map((item) => ({
    name: item.name,
    category: item.category,
    onHand: item.onHand,
    unit: item.unit,
    reorderThreshold: item.reorderThreshold,
    supplier: item.supplier,
    status: inventoryHealth(item)
  }));
}

export function supplierConcentration(inventory: InventoryItem[]) {
  const map = new Map<string, number>();
  inventory.forEach((i) => map.set(i.supplier, (map.get(i.supplier) ?? 0) + 1));
  return Array.from(map.entries())
    .sort(([, a], [, b]) => b - a)
    .map(([supplier, count]) => ({ supplier, count }));
}

// ─── Batches by month ─────────────────────────────────────────────────────────

export function batchesByMonth(batches: Batch[]) {
  const map = new Map<string, number>();
  batches
    .filter((b) => b.actualBrewDate)
    .forEach((b) => {
      const month = b.actualBrewDate!.slice(0, 7);
      map.set(month, (map.get(month) ?? 0) + 1);
    });
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));
}
