import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Activity, Batch, Beer, InventoryItem, Tank } from "@/lib/types";
import { inventoryHealth, summarizeMetrics } from "@/lib/utils";

type BatchRow = {
  id: string;
  batch_number: string;
  beer_id: string | null;
  beer_name: string;
  style: string;
  stage: Batch["stage"];
  planned_brew_date: string;
  planned_end_date: string | null;
  actual_brew_date: string | null;
  updated_at: string | null;
  assigned_tank_id: string | null;
  target_volume_bbl: number;
  actual_volume_bbl: number | null;
  og: number | null;
  fg: number | null;
  abv: number | null;
  ibu: number | null;
  package_type: Batch["packageType"] | null;
  package_date: string | null;
  packaged_units: number | null;
  notes: string;
};

type BeerRow = {
  id: string;
  name: string;
  style: string;
  active: boolean;
  production_days: number | null;
  target_og: number | null;
  target_fg: number | null;
  target_abv: number | null;
  target_ibu: number | null;
  default_package_type: Beer["defaultPackageType"] | null;
  notes: string;
};

type TankRow = {
  id: string;
  name: string;
  type: Tank["type"];
  capacity_bbl: number;
  status: Tank["status"];
  last_cip_date: string | null;
};

type InventoryRow = {
  id: string;
  name: string;
  category: InventoryItem["category"];
  on_hand: number;
  unit: string;
  reorder_threshold: number;
  supplier: string;
};

type AdjustmentRow = {
  id: string;
  created_at: string;
  adjustment_amount: number;
  reason: string;
  inventory_items: { name: string } | null;
  batches: { beer_name: string } | null;
};
function mapBatch(row: BatchRow): Batch {
  return {
    id: row.id,
    batchNumber: row.batch_number,
    beerId: row.beer_id ?? undefined,
    beerName: row.beer_name,
    style: row.style,
    stage: row.stage,
    plannedBrewDate: row.planned_brew_date,
    plannedEndDate: row.planned_end_date ?? undefined,
    actualBrewDate: row.actual_brew_date ?? undefined,
    updatedAt: row.updated_at ?? undefined,
    assignedTankId: row.assigned_tank_id ?? undefined,
    targetVolumeBbl: row.target_volume_bbl,
    actualVolumeBbl: row.actual_volume_bbl ?? undefined,
    og: row.og ?? undefined,
    fg: row.fg ?? undefined,
    abv: row.abv ?? undefined,
    ibu: row.ibu ?? undefined,
    notes: row.notes,
    packageType: row.package_type ?? undefined,
    packageDate: row.package_date ?? undefined,
    packagedUnits: row.packaged_units ?? undefined
  };
}

function mapBeer(row: BeerRow): Beer {
  return {
    id: row.id,
    name: row.name,
    style: row.style,
    active: row.active,
    productionDays: row.production_days ?? undefined,
    targetOg: row.target_og ?? undefined,
    targetFg: row.target_fg ?? undefined,
    targetAbv: row.target_abv ?? undefined,
    targetIbu: row.target_ibu ?? undefined,
    defaultPackageType: row.default_package_type ?? undefined,
    notes: row.notes
  };
}

function mapTank(row: TankRow, currentBatchId?: string): Tank {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    capacityBbl: row.capacity_bbl,
    status: row.status,
    currentBatchId,
    lastCipDate: row.last_cip_date ?? "Not logged"
  };
}

function mapInventoryItem(row: InventoryRow): InventoryItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    onHand: row.on_hand,
    unit: row.unit,
    reorderThreshold: row.reorder_threshold,
    supplier: row.supplier
  };
}

export const getAppData = cache(async function getAppData() {
  const supabase = await createSupabaseServerClient();

  const [batchesResult, beersResult, tanksResult, inventoryResult, logsResult] = await Promise.all([
    supabase.from("batches").select("*").order("planned_brew_date", { ascending: false }),
    supabase.from("beers").select("*").order("name", { ascending: true }),
    supabase.from("tanks").select("*").order("name", { ascending: true }),
    supabase.from("inventory_items").select("*").order("name", { ascending: true }),
    supabase
      .from("batch_logs")
      .select("id, created_at, stage, note, batches(beer_name, batch_number), app_users(full_name)")
      .order("created_at", { ascending: false })
      .limit(100)
  ]);

  const batches = (batchesResult.data ?? []).map((r) => mapBatch(r as BatchRow));
  const beers = (beersResult.data ?? []).map((r) => mapBeer(r as BeerRow));

  const currentBatchIdsByTank = new Map<string, string>();
  batches.forEach((batch) => {
    if (batch.assignedTankId && batch.stage !== "Completed") {
      currentBatchIdsByTank.set(batch.assignedTankId, batch.id);
    }
  });

  const tanks = (tanksResult.data ?? []).map((r) => mapTank(r as TankRow, currentBatchIdsByTank.get(r.id)));
  const inventory = (inventoryResult.data ?? []).map((r) => mapInventoryItem(r as InventoryRow));

  type LogRow = {
    id: string;
    created_at: string;
    stage: string;
    note: string;
    batches: { beer_name: string; batch_number: string } | null;
    app_users: { full_name: string } | null;
  };

  const recentActivity = (logsResult.data as unknown as LogRow[] ?? []).map((row) => ({
    id: row.id,
    date: row.created_at.slice(0, 10),
    title: [row.batches?.beer_name, row.batches?.batch_number].filter(Boolean).join(" — "),
    detail: [row.app_users?.full_name, row.note, row.stage]
      .filter(Boolean)
      .join(" - ")
  } satisfies Activity));

  return {
    batches,
    beers,
    tanks,
    inventory,
    recentActivity,
    metrics: summarizeMetrics(batches, tanks, inventory),
    warning: [
      batchesResult.error?.message,
      beersResult.error?.message,
      tanksResult.error?.message,
      inventoryResult.error?.message,
      logsResult.error?.message
    ].filter(Boolean).join(" | ") || undefined
  };
});

export function getLowStockItems(items: InventoryItem[]) {
  return items.filter((item) => inventoryHealth(item) === "low");
}
