"use client";

import { useState } from "react";
import { BatchDialog } from "@/components/batch-dialog";
import { CellarGrid } from "@/components/cellar-grid";
import { LogPackagingDialog } from "@/components/log-packaging-dialog";
import { NewBatchDialog } from "@/components/new-batch-dialog";
import { InventoryAttention } from "@/components/inventory-attention";
import { RecentActivityPanel } from "@/components/recent-activity";
import { PageHeader, SectionCard } from "@/components/ui";
import { Activity, Batch, Beer, InventoryItem, Tank } from "@/lib/types";
import { deriveTankStatus, formatDate, getTankById, inventoryHealth, stageTone, tankTone } from "@/lib/utils";

export function Dashboard({
  batches,
  tanks,
  inventory,
  recentActivity,
  beers,
  updateAction,
  createAction,
  deleteAction,
  reassignAction,
  adjustAction
}: {
  batches: Batch[];
  tanks: Tank[];
  inventory: InventoryItem[];
  recentActivity: Activity[];
  beers: Beer[];
  updateAction: (formData: FormData) => Promise<void>;
  createAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
  reassignAction: (formData: FormData) => Promise<void>;
  adjustAction: (formData: FormData) => Promise<void>;
}) {
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [packagingBatch, setPackagingBatch] = useState<Batch | null>(null);
  const [newBatchOpen, setNewBatchOpen] = useState(false);
  const [newBatchTankId, setNewBatchTankId] = useState("");
  const [activityOpen, setActivityOpen] = useState(false);

  const packagingQueue = batches.filter((b) => b.stage === "Packaging" || b.stage === "Conditioning");

  // Packaging summary — completed batches this calendar month
  const thisMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const packagedThisMonth = batches.filter(
    (b) => b.packageDate && b.packageDate.startsWith(thisMonth) && b.packagedUnits
  );
  const kegsThisMonth = packagedThisMonth
    .filter((b) => b.packageType === "Keg")
    .reduce((sum, b) => sum + (b.packagedUnits ?? 0), 0);
  const cansThisMonth = packagedThisMonth
    .filter((b) => b.packageType === "Can")
    .reduce((sum, b) => sum + (b.packagedUnits ?? 0), 0);
  const monthLabel = new Date().toLocaleString("default", { month: "long" });

  return (
    <div className="space-y-6">

      {/* Tank snapshot — primary production view */}
      <SectionCard
        title="Cellar"
        action={
          <button type="button" onClick={() => { setNewBatchTankId(""); setNewBatchOpen(true); }} className="button-primary text-sm">
            Add batch
          </button>
        }
      >
        <CellarGrid
          tanks={tanks}
          batches={batches}
          onTankClick={(batch) => setSelectedBatch(batch)}
          onAvailableClick={(tankId) => { setNewBatchTankId(tankId); setNewBatchOpen(true); }}
          reassignAction={reassignAction}
        />
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <SectionCard title="Packaging queue">
          {/* Month summary */}
          {(kegsThisMonth > 0 || cansThisMonth > 0) && (
            <div className="mb-4 flex flex-wrap gap-4 border-b border-[var(--border)] pb-4">
              <div className="text-sm">
                <span className="text-muted">{monthLabel} kegs: </span>
                <span className="font-semibold">{kegsThisMonth}</span>
              </div>
              <div className="text-sm">
                <span className="text-muted">{monthLabel} cans: </span>
                <span className="font-semibold">{cansThisMonth.toLocaleString()}</span>
              </div>
            </div>
          )}
          <div className="ops-divider">
            {packagingQueue.length === 0 ? (
              <p className="py-2 text-sm text-muted">No batches nearing packaging.</p>
            ) : packagingQueue.map((batch) => (
              <div key={batch.id} className="ops-item">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <button
                    type="button"
                    onClick={() => setSelectedBatch(batch)}
                    className="text-left transition hover:opacity-80"
                  >
                    <p className="text-lg font-semibold">{batch.beerName}</p>
                    <p className="text-sm text-muted">{batch.batchNumber} • {batch.style}</p>
                  </button>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`pill ${stageTone(batch.stage)}`}>{batch.stage}</span>
                    <button
                      type="button"
                      onClick={() => setPackagingBatch(batch)}
                      className="button-primary text-xs py-1 px-3"
                    >
                      Log packaging
                    </button>
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

        <SectionCard
          title="Recent activity"
          action={
            <button type="button" onClick={() => setActivityOpen(true)} className="text-xs text-muted underline-offset-2 hover:underline hover:text-ink transition">
              View all
            </button>
          }
        >
          <RecentActivityPanel
            items={recentActivity}
            open={activityOpen}
            onOpen={() => setActivityOpen(true)}
            onClose={() => setActivityOpen(false)}
          />
        </SectionCard>      </div>

      <SectionCard title="Inventory attention">
        <InventoryAttention inventory={inventory} batches={batches} adjustAction={adjustAction} />
      </SectionCard>

      <BatchDialog
        batch={selectedBatch}
        onClose={() => setSelectedBatch(null)}
        updateAction={updateAction}
        deleteAction={deleteAction}
      />

      <LogPackagingDialog
        batch={packagingBatch}
        onClose={() => setPackagingBatch(null)}
        updateAction={updateAction}
      />

      <NewBatchDialog
        open={newBatchOpen}
        onClose={() => setNewBatchOpen(false)}
        batches={batches}
        tanks={tanks}
        beers={beers}
        createAction={createAction}
        defaultTankId={newBatchTankId}
      />
    </div>
  );
}
