"use client";

import { useEffect, useState } from "react";
import { BatchDialog } from "@/components/batch-dialog";
import { CellarGrid } from "@/components/cellar-grid";
import { LogPackagingDialog } from "@/components/log-packaging-dialog";
import { NewBatchDialog } from "@/components/new-batch-dialog";
import { InventoryAttention } from "@/components/inventory-attention";
import { SectionCard } from "@/components/ui";
import { useNotifications } from "@/components/notification-context";
import { Activity, Batch, Beer, InventoryItem, Recipe, Tank } from "@/lib/types";
import { formatDate, getTankById, stageTone } from "@/lib/utils";

export function Dashboard({
  batches,
  tanks,
  inventory,
  recentActivity,
  beers,
  recipes,
  updateAction,
  createAction,
  deleteAction,
  reassignAction,
  adjustAction,
  varianceAction
}: {
  batches: Batch[];
  tanks: Tank[];
  inventory: InventoryItem[];
  recentActivity: Activity[];
  beers: Beer[];
  recipes: Recipe[];
  updateAction: (formData: FormData) => Promise<void>;
  createAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
  reassignAction: (formData: FormData) => Promise<void>;
  adjustAction: (formData: FormData) => Promise<void>;
  varianceAction: (formData: FormData) => Promise<void>;
}) {
  const { setActivity, setBatches } = useNotifications();
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [packagingBatch, setPackagingBatch] = useState<Batch | null>(null);
  const [newBatchOpen, setNewBatchOpen] = useState(false);
  const [newBatchTankId, setNewBatchTankId] = useState("");

  // Lifted drag state shared between planned queue and cellar grid
  const [dragBatchId, setDragBatchId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  useEffect(() => { setActivity(recentActivity); }, [recentActivity]);
  useEffect(() => { setBatches(batches); }, [batches]);

  const plannedUnassigned = batches.filter((b) => b.stage === "Planned" && !b.assignedTankId);
  const packagingQueue = batches.filter((b) => b.stage === "Packaging" || b.stage === "Conditioning");

  const thisMonth = new Date().toISOString().slice(0, 7);
  const packagedThisMonth = batches.filter((b) => b.packageDate?.startsWith(thisMonth) && b.packagedUnits);
  const kegsThisMonth = packagedThisMonth.filter((b) => b.packageType === "Keg").reduce((s, b) => s + (b.packagedUnits ?? 0), 0);
  const cansThisMonth = packagedThisMonth.filter((b) => b.packageType === "Can").reduce((s, b) => s + (b.packagedUnits ?? 0), 0);
  const monthLabel = new Date().toLocaleString("default", { month: "long" });

  return (
    <div className="space-y-6">

      {/* Planned queue */}
      <SectionCard
        title="Planned"
        subtitle="Drag a batch into a tank to assign it"
        action={
          <button type="button" onClick={() => { setNewBatchTankId(""); setNewBatchOpen(true); }} className="button-primary text-sm">
            Add batch
          </button>
        }
      >
        {plannedUnassigned.length === 0 ? (
          <p className="text-sm text-muted">No unassigned planned batches.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {plannedUnassigned.map((batch) => {
              const isDragging = dragBatchId === batch.id;
              return (
                <div
                  key={batch.id}
                  draggable
                  onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; setDragBatchId(batch.id); }}
                  onDragEnd={() => { setDragBatchId(null); setDropTargetId(null); }}
                  onClick={() => setSelectedBatch(batch)}
                  className={`cursor-grab border border-[var(--border)] bg-[var(--surface)] p-4 transition active:cursor-grabbing hover:border-[var(--accent)] ${isDragging ? "opacity-40" : ""}`}
                  style={{ minWidth: "200px" }}
                >
                  <p className="font-semibold text-ink">{batch.beerName}</p>
                  <p className="mt-0.5 text-sm text-muted">{batch.batchNumber} · {batch.style}</p>
                  <p className="mt-2 text-xs text-muted">Brew date: {formatDate(batch.plannedBrewDate)}</p>
                  {batch.targetVolumeBbl && (
                    <p className="text-xs text-muted">{batch.targetVolumeBbl} bbl</p>
                  )}
                  <p className="mt-2 text-xs text-muted opacity-60">⠿ Drag to assign tank</p>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* Cellar */}
      <SectionCard title="Cellar">
        <CellarGrid
          tanks={tanks}
          batches={batches}
          dragBatchId={dragBatchId}
          dropTargetId={dropTargetId}
          onTankClick={(batch) => setSelectedBatch(batch)}
          onAvailableClick={(tankId) => { setNewBatchTankId(tankId); setNewBatchOpen(true); }}
          onDragStart={(id) => setDragBatchId(id)}
          onDragEnd={() => { setDragBatchId(null); setDropTargetId(null); }}
          onDropTargetChange={setDropTargetId}
          reassignAction={reassignAction}
        />
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Packaging queue">
          {(kegsThisMonth > 0 || cansThisMonth > 0) && (
            <div className="mb-4 flex flex-wrap gap-4 border-b border-[var(--border)] pb-4">
              <div className="text-sm"><span className="text-muted">{monthLabel} kegs: </span><span className="font-semibold">{kegsThisMonth}</span></div>
              <div className="text-sm"><span className="text-muted">{monthLabel} cans: </span><span className="font-semibold">{cansThisMonth.toLocaleString()}</span></div>
            </div>
          )}
          <div className="ops-divider">
            {packagingQueue.length === 0 ? (
              <p className="py-2 text-sm text-muted">No batches nearing packaging.</p>
            ) : packagingQueue.map((batch) => (
              <div key={batch.id} className="ops-item">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <button type="button" onClick={() => setSelectedBatch(batch)} className="text-left transition hover:opacity-80">
                    <p className="text-lg font-semibold">{batch.beerName}</p>
                    <p className="text-sm text-muted">{batch.batchNumber} • {batch.style}</p>
                  </button>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`pill ${stageTone(batch.stage)}`}>{batch.stage}</span>
                    <button type="button" onClick={() => setPackagingBatch(batch)} className="button-secondary text-sm">Log packaging</button>
                  </div>
                </div>
                <div className="mt-3 grid gap-3 text-sm text-muted sm:grid-cols-3">
                  <p>Tank: {getTankById(tanks, batch.assignedTankId)?.name ?? "Unassigned"}</p>
                  <p>ABV: {batch.abv ?? "Pending"}</p>
                  <p>Package: {batch.packageType ?? "Pending"}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Inventory attention">
          <InventoryAttention inventory={inventory} batches={batches} adjustAction={adjustAction} />
        </SectionCard>
      </div>

      <BatchDialog batch={selectedBatch} recipes={recipes} onClose={() => setSelectedBatch(null)} updateAction={updateAction} deleteAction={deleteAction} varianceAction={varianceAction} />
      <LogPackagingDialog batch={packagingBatch} onClose={() => setPackagingBatch(null)} updateAction={updateAction} />
      <NewBatchDialog open={newBatchOpen} onClose={() => setNewBatchOpen(false)} batches={batches} tanks={tanks} beers={beers} inventory={inventory} recipes={recipes} createAction={createAction} defaultTankId={newBatchTankId} />
    </div>
  );
}
