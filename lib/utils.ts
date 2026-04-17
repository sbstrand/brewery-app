import { Batch, InventoryItem, Tank } from "@/lib/types";

export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.slice(0, 10).split("-");
  return `${m}/${d}/${y}`;
}

export function inventoryHealth(item: InventoryItem): "healthy" | "low" {
  return item.onHand <= item.reorderThreshold ? "low" : "healthy";
}

export function generateBatchNumber(existingBatches: { batchNumber: string }[]): string {
  const year = new Date().getFullYear();
  const prefix = `${year}-`;
  const highest = existingBatches
    .map((b) => b.batchNumber)
    .filter((n) => n.startsWith(prefix))
    .map((n) => parseInt(n.slice(prefix.length), 10))
    .filter((n) => !isNaN(n))
    .reduce((max, n) => Math.max(max, n), 0);
  return `${prefix}${String(highest + 1).padStart(3, "0")}`;
}

export function stageTone(stage: Batch["stage"]): string {
  switch (stage) {
    case "Completed":
      return "pill-success";
    case "Packaging":
    case "Conditioning":
    case "Brewing":
    case "Fermenting":
      return "pill-warning";
    case "Planned":
      return "pill-neutral";
  }
}

export function tankTone(status: Tank["status"]): string {
  switch (status) {
    case "Available":
      return "pill-success";
    case "Cleaning":
      return "pill-warning";
    case "Maintenance":
      return "pill-danger";
    default:
      return "pill-neutral";
  }
}

export function getTankById(tanks: Tank[], id?: string): Tank | undefined {
  return tanks.find((tank) => tank.id === id);
}

export function getBatchById(batches: Batch[], id?: string): Batch | undefined {
  return batches.find((batch) => batch.id === id);
}

export function deriveTankStatus(tank: Tank, batches: Batch[]): Tank["status"] {
  const active = batches.find((b) => b.assignedTankId === tank.id && b.stage !== "Completed");
  if (active) return "In Use";
  if (tank.status === "Cleaning" || tank.status === "Maintenance") return tank.status;
  return "Available";
}

export function summarizeMetrics(batches: Batch[], tanks: Tank[], inventory: InventoryItem[]) {
  const today = new Date().toISOString().slice(0, 10);

  return {
    activeBatches: batches.filter((batch) => batch.stage !== "Completed").length,
    tanksInUse: tanks.filter((tank) => deriveTankStatus(tank, batches) === "In Use").length,
    lowStockItems: inventory.filter((item) => inventoryHealth(item) === "low").length,
    packagingToday: batches.filter((batch) => batch.packageDate === today).length
  };
}
