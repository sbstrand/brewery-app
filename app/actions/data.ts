"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function readField(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalNumber(formData: FormData, key: string): number | null {
  const value = readField(formData, key);
  if (!value) return null;
  const n = Number(value);
  return isNaN(n) ? null : n;
}

// ─── Batches ─────────────────────────────────────────────────────────────────

export async function createBatch(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  const { data: existing } = await supabase
    .from("batches")
    .select("batch_number")
    .order("batch_number", { ascending: false });

  const year = new Date().getFullYear();
  const prefix = `${year}-`;
  const highest = (existing ?? [])
    .map((r: { batch_number: string }) => r.batch_number)
    .filter((n: string) => n.startsWith(prefix))
    .map((n: string) => parseInt(n.slice(prefix.length), 10))
    .filter((n: number) => !isNaN(n))
    .reduce((max: number, n: number) => Math.max(max, n), 0);
  const batchNumber = `${prefix}${String(highest + 1).padStart(3, "0")}`;

  const { error } = await supabase.from("batches").insert({
    batch_number: batchNumber,
    beer_id: readField(formData, "beerId") || null,
    beer_name: readField(formData, "beerName"),
    style: readField(formData, "style"),
    stage: readField(formData, "stage") || "Planned",
    planned_brew_date: readField(formData, "plannedBrewDate"),
    planned_end_date: readField(formData, "plannedEndDate") || null,
    assigned_tank_id: readField(formData, "assignedTankId") || null,
    target_volume_bbl: Number(readField(formData, "targetVolumeBbl")),
    og: readOptionalNumber(formData, "og"),
    fg: readOptionalNumber(formData, "fg"),
    abv: readOptionalNumber(formData, "abv"),
    ibu: readOptionalNumber(formData, "ibu"),
    package_type: readField(formData, "packageType") || null,
    notes: readField(formData, "notes")
  });

  if (error) throw new Error(error.message);
  revalidatePath("/batches");
  revalidatePath("/");
}

// ─── Beers ────────────────────────────────────────────────────────────────────

export async function createBeer(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("beers").insert({
    name: readField(formData, "name"),
    style: readField(formData, "style"),
    production_days: readOptionalNumber(formData, "productionDays"),
    target_og: readOptionalNumber(formData, "targetOg"),
    target_fg: readOptionalNumber(formData, "targetFg"),
    target_abv: readOptionalNumber(formData, "targetAbv"),
    target_ibu: readOptionalNumber(formData, "targetIbu"),
    default_package_type: readField(formData, "defaultPackageType") || null,
    notes: readField(formData, "notes")
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/beers");
}

export async function updateBeer(formData: FormData) {
  const id = readField(formData, "id");
  if (!id) throw new Error("Missing beer id");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("beers").update({
    name: readField(formData, "name"),
    style: readField(formData, "style"),
    production_days: readOptionalNumber(formData, "productionDays"),
    target_og: readOptionalNumber(formData, "targetOg"),
    target_fg: readOptionalNumber(formData, "targetFg"),
    target_abv: readOptionalNumber(formData, "targetAbv"),
    target_ibu: readOptionalNumber(formData, "targetIbu"),
    default_package_type: readField(formData, "defaultPackageType") || null,
    notes: readField(formData, "notes")
  }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/beers");
}
// ─── Tanks ────────────────────────────────────────────────────────────────────

export async function createTankAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("tanks").insert({
    name: readField(formData, "name"),
    type: readField(formData, "type"),
    capacity_bbl: Number(readField(formData, "capacityBbl"))
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/tanks");
  revalidatePath("/");
}

export async function updateTank(formData: FormData) {
  const id = readField(formData, "id");
  if (!id) throw new Error("Missing tank id");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("tanks").update({
    name: readField(formData, "name"),
    type: readField(formData, "type"),
    capacity_bbl: Number(readField(formData, "capacityBbl"))
  }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/tanks");
  revalidatePath("/");
}

export async function logCip(formData: FormData) {
  const id = readField(formData, "id");
  const date = readField(formData, "lastCipDate");
  if (!id || !date) throw new Error("Missing id or date");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("tanks").update({ last_cip_date: date }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/tanks");
}

// ─── Inventory ────────────────────────────────────────────────────────────────

export async function createInventoryItem(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("inventory_items").insert({
    name: readField(formData, "name"),
    category: readField(formData, "category"),
    on_hand: Number(readField(formData, "onHand")),
    unit: readField(formData, "unit"),
    reorder_threshold: Number(readField(formData, "reorderThreshold")),
    supplier: readField(formData, "supplier")
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/inventory");
  revalidatePath("/");
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function updateUserRole(formData: FormData) {
  const id = readField(formData, "id");
  const role = readField(formData, "role");
  if (!id || !role) throw new Error("Missing id or role");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("app_users").update({ role }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/users");
}

// ─── Batch lifecycle ──────────────────────────────────────────────────────────

export async function updateBatch(formData: FormData) {
  const id = readField(formData, "id");
  if (!id) throw new Error("Missing batch id");

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("batches").update({
    stage: readField(formData, "stage"),
    actual_brew_date: readField(formData, "actualBrewDate") || null,
    actual_volume_bbl: readOptionalNumber(formData, "actualVolumeBbl"),
    og: readOptionalNumber(formData, "og"),
    fg: readOptionalNumber(formData, "fg"),
    abv: readOptionalNumber(formData, "abv"),
    ibu: readOptionalNumber(formData, "ibu"),
    package_type: readField(formData, "packageType") || null,
    package_date: readField(formData, "packageDate") || null,
    packaged_units: readOptionalNumber(formData, "packagedUnits"),
    notes: readField(formData, "notes")
  }).eq("id", id);

  if (error) throw new Error(error.message);

  // Log the update
  const note = readField(formData, "logNote");
  const stage = readField(formData, "stage");
  if (note || stage) {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("batch_logs").insert({
      batch_id: id,
      stage,
      note,
      created_by: user?.id ?? null
    });
  }

  revalidatePath("/batches");
  revalidatePath("/");
}

export async function getBatchLogs(batchId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("batch_logs")
    .select("id, stage, note, created_at, app_users(full_name)")
    .eq("batch_id", batchId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row: {
    id: string;
    stage: string;
    note: string;
    created_at: string;
    app_users: { full_name: string } | { full_name: string }[] | null;
    batches: { beer_name: string; batch_number: string } | { beer_name: string; batch_number: string }[] | null;
  }) => {
    const appUser = Array.isArray(row.app_users) ? row.app_users[0] : row.app_users;
    const batch = Array.isArray(row.batches) ? row.batches[0] : row.batches;
    return {
      id: row.id,
      batchId,
      stage: row.stage,
      note: row.note,
      createdBy: appUser?.full_name ?? "Unknown",
      createdAt: row.created_at
    };
  });
}

export async function deleteBatch(formData: FormData) {
  const id = readField(formData, "id");
  if (!id) throw new Error("Missing batch id");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("batches").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/batches");
  revalidatePath("/");
}

export async function toggleBeerActive(formData: FormData) {
  const id = readField(formData, "id");
  const active = readField(formData, "active") === "true";
  if (!id) throw new Error("Missing beer id");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("beers").update({ active }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/beers");
  revalidatePath("/batches");
  revalidatePath("/");
}

// ─── Admin user creation ──────────────────────────────────────────────────────

export async function adminCreateUser(formData: FormData) {
  const fullName = readField(formData, "fullName");
  const email = readField(formData, "email");
  const password = readField(formData, "password");
  const role = readField(formData, "role") || "General User";

  if (!fullName || !email || !password) throw new Error("Name, email and password are required.");

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, role } }
  });

  if (error) throw new Error(error.message);

  const userId = data.user?.id;
  if (userId) {
    const { error: profileError } = await supabase.from("app_users").upsert(
      { id: userId, full_name: fullName, email, role, status: "active" },
      { onConflict: "id" }
    );
    if (profileError) throw new Error(profileError.message);
  }

  revalidatePath("/admin/users");
}

export async function updateUserStatus(formData: FormData) {
  const id = readField(formData, "id");
  const status = readField(formData, "status");
  if (!id || !status) throw new Error("Missing id or status");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("app_users").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/users");
}

// ─── Batch tank reassignment ──────────────────────────────────────────────────

export async function reassignBatchTank(formData: FormData) {
  const batchId = readField(formData, "batchId");
  const newTankId = readField(formData, "newTankId");
  const oldTankName = readField(formData, "oldTankName");
  const newTankName = readField(formData, "newTankName");
  if (!batchId || !newTankId) throw new Error("Missing batchId or newTankId");

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("batches")
    .update({ assigned_tank_id: newTankId })
    .eq("id", batchId);

  if (error) throw new Error(error.message);

  // Log the move
  const { data: { user } } = await supabase.auth.getUser();
  const note = oldTankName
    ? `Moved from ${oldTankName} to ${newTankName}.`
    : `Assigned to ${newTankName}.`;

  const { data: batch } = await supabase
    .from("batches")
    .select("stage")
    .eq("id", batchId)
    .single();

  await supabase.from("batch_logs").insert({
    batch_id: batchId,
    stage: batch?.stage ?? "Planned",
    note,
    created_by: user?.id ?? null
  });

  revalidatePath("/");
  revalidatePath("/batches");
}

// ─── Inventory management ─────────────────────────────────────────────────────

export async function updateInventoryItem(formData: FormData) {
  const id = readField(formData, "id");
  if (!id) throw new Error("Missing id");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("inventory_items").update({
    name: readField(formData, "name"),
    category: readField(formData, "category"),
    unit: readField(formData, "unit"),
    reorder_threshold: Number(readField(formData, "reorderThreshold")),
    supplier: readField(formData, "supplier")
  }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/inventory");
  revalidatePath("/");
}

export async function logInventoryAdjustment(formData: FormData) {
  const itemId = readField(formData, "itemId");
  const amount = Number(readField(formData, "amount"));
  const adjustmentType = readField(formData, "adjustmentType");
  const reason = readField(formData, "reason");
  const batchId = readField(formData, "batchId") || null;

  if (!itemId || !amount || !reason) throw new Error("Missing required fields");

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Insert adjustment record
  const { error: adjError } = await supabase.from("inventory_adjustments").insert({
    inventory_item_id: itemId,
    batch_id: batchId,
    adjustment_amount: amount,
    adjustment_type: adjustmentType || "adjustment",
    reason,
    created_by: user?.id ?? null
  });
  if (adjError) throw new Error(adjError.message);

  // Update on_hand
  const { data: item, error: fetchError } = await supabase
    .from("inventory_items")
    .select("on_hand")
    .eq("id", itemId)
    .single();
  if (fetchError) throw new Error(fetchError.message);

  const { error: updateError } = await supabase
    .from("inventory_items")
    .update({ on_hand: (item.on_hand ?? 0) + amount })
    .eq("id", itemId);
  if (updateError) throw new Error(updateError.message);

  revalidatePath("/admin/inventory");
  revalidatePath("/");
}

export async function getInventoryAdjustments(itemId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("inventory_adjustments")
    .select("id, adjustment_amount, adjustment_type, reason, created_at, app_users(full_name), batches(beer_name, batch_number)")
    .eq("inventory_item_id", itemId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row: {
    id: string;
    adjustment_amount: number;
    adjustment_type: string;
    reason: string;
    created_at: string;
    app_users: { full_name: string } | { full_name: string }[] | null;
    batches: { beer_name: string; batch_number: string } | { beer_name: string; batch_number: string }[] | null;
  }) => {
    const user = Array.isArray(row.app_users) ? row.app_users[0] : row.app_users;
    const batch = Array.isArray(row.batches) ? row.batches[0] : row.batches;
    return {
      id: row.id,
      inventoryItemId: itemId,
      adjustmentAmount: row.adjustment_amount,
      adjustmentType: row.adjustment_type as import("@/lib/types").AdjustmentType,
      reason: row.reason,
      createdBy: user?.full_name ?? "Unknown",
      createdAt: row.created_at,
      batchName: batch ? `${batch.beer_name} (${batch.batch_number})` : undefined
    };
  });
}
