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
import { deriveTankStatus, formatDate, getTankById, inventoryHealth, stageTone } from "@/lib/utils";

const CELLAR_STAGES = ["Brewing", "Fermenting", "Conditioning", "Packaging"] as const;
type CellarStage = typeof CELLAR_STAGES[number];

function StageView({ batches, tanks, onBatchClick }: {
  batches: Batch[];
  tanks: Tank[];
  onBatchClick: (batch: Batch) => void;
}) {
  const active = batches.filter((b) => b.stage !== "Planned" && b.stage !== "Completed");
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {CELLAR_STAGES.map((stage) => {
        const stageBatches = active.filter((b) => b.stage === stage);
        return (
          <div key={stage}>
            <div className="mb-3 flex items-center gap-2">
              <span className={`pill text-xs ${stageTone(stage as CellarStage)}`}>{stage}</span>
              <span className="text-xs text-muted">{stageBatches.length}</span>
            </div>
            <div className="space-y-2">
              {stageBatches.length === 0 ? (
                <p className="text-xs text-muted">None</p>
              ) : stageBatches.map((batch) => (
                <button
                  key={batch.id}
                  type="button"
                  onClick={() => onBatchClick(batch)}
                  className="w-full border border-[var(--border)] bg-[var(--surface)] p-3 text-left transition hover:border-[var(--accent)] hover:opacity-90"
                >
                  <p className="text-sm font-bold text-ink leading-tight">{batch.beerName}</p>
                  <p className="mt-1 text-xs text-muted">{getTankById(tanks, batch.assignedTankId)?.name ?? "Unassigned"}</p>
                  <p className="mt-1 text-xs text-muted">
                    Since {formatDate(batch.updatedAt ?? batch.actualBrewDate ?? batch.plannedBrewDate)}
                  </p>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

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
  varianceAction,
  removeTankAction
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
  removeTankAction: (formData: FormData) => Promise<void>;
}) {
  const { setActivity, setBatches } = useNotifications();
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [packagingBatch, setPackagingBatch] = useState<Batch | null>(null);
  const [newBatchOpen, setNewBatchOpen] = useState(false);
  const [newBatchTankId, setNewBatchTankId] = useState("");

  const [cellarView, setCellarView] = useState<"tank" | "stage">("tank");

  // Lifted drag state shared between planned queue and cellar grid
  const [dragBatchId, setDragBatchId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  useEffect(() => { setActivity(recentActivity); }, [recentActivity]);
  useEffect(() => { setBatches(batches); }, [batches]);

  const plannedUnassigned = batches.filter((b) => b.stage === "Planned" && !b.assignedTankId);
  const plannedAll = batches.filter((b) => b.stage === "Planned");
  const packagingQueue = batches.filter((b) => b.stage === "Packaging" || b.stage === "Conditioning");
  const activeBatches = batches.filter((b) => b.stage !== "Completed" && b.stage !== "Planned").length;
  const tanksInUse = tanks.filter((t) => deriveTankStatus(t, batches) === "In Use").length;
  const readyForPackaging = batches.filter((b) => b.stage === "Conditioning" || b.stage === "Packaging").length;
  const lowInventory = inventory.filter((i) => inventoryHealth(i) === "low").length;

  const thisMonth = new Date().toISOString().slice(0, 7);
  const packagedThisMonth = batches.filter((b) => b.packageDate?.startsWith(thisMonth) && b.packagedUnits);
  const kegsThisMonth = packagedThisMonth.filter((b) => b.packageType === "Keg").reduce((s, b) => s + (b.packagedUnits ?? 0), 0);
  const cansThisMonth = packagedThisMonth.filter((b) => b.packageType === "Can").reduce((s, b) => s + (b.packagedUnits ?? 0), 0);
  const monthLabel = new Date().toLocaleString("default", { month: "long" });

  return (
    <div className="space-y-6">

      {/* Stat bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Active batches",
            value: activeBatches,
            circleColor: "bg-[rgba(100,160,220,0.18)]",
            iconColor: "text-[#4a90d9]",
            icon: (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            ),
            accent: false
          },
          {
            label: "Tanks in use",
            value: `${tanksInUse} / ${tanks.length}`,
            circleColor: "bg-[rgba(140,100,220,0.18)]",
            iconColor: "text-[#8a5cd8]",
            icon: (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <rect x="6" y="3" width="12" height="16" rx="3" />
                <line x1="6" y1="7" x2="18" y2="7" />
                <line x1="12" y1="19" x2="12" y2="22" />
                <line x1="9" y1="22" x2="15" y2="22" />
              </svg>
            ),
            accent: false
          },
          {
            label: "Ready for packaging",
            value: readyForPackaging,
            circleColor: "bg-[rgba(224,200,48,0.18)]",
            iconColor: "text-[#c8a820]",
            icon: (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            ),
            accent: readyForPackaging > 0
          },
          {
            label: "Low inventory",
            value: lowInventory,
            circleColor: "bg-[rgba(224,92,75,0.18)]",
            iconColor: "text-[#d94f3a]",
            icon: (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            ),
            accent: lowInventory > 0
          }
        ].map(({ label, value, icon, circleColor, iconColor, accent }) => (
          <div key={label} className="border border-[var(--border)] bg-[var(--surface)] p-4 flex items-center gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${circleColor}`}>
              <div className={iconColor}>{icon}</div>
            </div>
            <div>
              <p className={`text-2xl font-bold tracking-tight ${accent ? "text-[var(--accent)]" : "text-ink"}`}>{value}</p>
              <p className="mt-0.5 text-xs text-muted">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Planned queue */}
      <SectionCard
        title="Planned"
        subtitle="Drag a batch into a tank to assign it"
        iconCircleColor="bg-[rgba(154,152,168,0.18)]"
        iconColor="text-[#9a98a8]"
        icon={
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        }
        action={
          <button type="button" onClick={() => { setNewBatchTankId(""); setNewBatchOpen(true); }} className="button-primary text-sm">
            Add batch
          </button>
        }
      >
        <div
          onDragOver={(e) => { if (dragBatchId) { e.preventDefault(); setDropTargetId("planned"); } }}
          onDragLeave={() => { if (dropTargetId === "planned") setDropTargetId(null); }}
          onDrop={(e) => {
            e.preventDefault();
            setDropTargetId(null);
            if (!dragBatchId) return;
            const batch = batches.find((b) => b.id === dragBatchId);
            if (!batch || batch.stage !== "Planned" || !batch.assignedTankId) return;
            const fd = new FormData();
            fd.set("batchId", batch.id);
            fd.set("oldTankName", tanks.find((t) => t.id === batch.assignedTankId)?.name ?? "");
            removeTankAction(fd);
            setDragBatchId(null);
          }}
          className={`min-h-[60px] transition ${
            dropTargetId === "planned" ? "ring-2 ring-[var(--accent)] rounded bg-[rgba(201,168,76,0.06)]" : ""
          }`}
        >
          {plannedUnassigned.length === 0 ? (
            <p className="text-sm text-muted">{dragBatchId ? "Drop here to unassign tank" : "No unassigned planned batches."}</p>
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
        </div>
      </SectionCard>

      {/* Cellar */}
      <SectionCard
        title="Cellar"
        iconCircleColor="bg-[rgba(140,100,220,0.18)]"
        iconColor="text-[#8a5cd8]"
        icon={
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <rect x="6" y="3" width="12" height="16" rx="3" />
            <line x1="6" y1="7" x2="18" y2="7" />
            <line x1="12" y1="19" x2="12" y2="22" />
            <line x1="9" y1="22" x2="15" y2="22" />
          </svg>
        }
        action={
          <div className="flex border border-[var(--border)] text-xs">
            {(["tank", "stage"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setCellarView(v)}
                className={`px-3 py-1.5 transition ${
                  cellarView === v
                    ? "bg-[var(--accent)] text-white font-semibold"
                    : "text-muted hover:text-ink"
                }`}
              >
                {v === "tank" ? "By Tank" : "By Stage"}
              </button>
            ))}
          </div>
        }
      >
        {cellarView === "tank" ? (
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
        ) : (
          <StageView batches={batches} tanks={tanks} onBatchClick={setSelectedBatch} />
        )}
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Packaging queue"
          iconCircleColor="bg-[rgba(224,200,48,0.18)]"
          iconColor="text-[#c8a820]"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V7" />
            </svg>
          }
        >
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

        <SectionCard
          title="Inventory attention"
          iconCircleColor="bg-[rgba(224,92,75,0.18)]"
          iconColor="text-[#d94f3a]"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          }
        >
          <InventoryAttention inventory={inventory} batches={batches} adjustAction={adjustAction} />
        </SectionCard>
      </div>

      <BatchDialog batch={selectedBatch} recipes={recipes} onClose={() => setSelectedBatch(null)} updateAction={updateAction} deleteAction={deleteAction} varianceAction={varianceAction} />
      <LogPackagingDialog batch={packagingBatch} onClose={() => setPackagingBatch(null)} updateAction={updateAction} />
      <NewBatchDialog open={newBatchOpen} onClose={() => setNewBatchOpen(false)} batches={batches} tanks={tanks} beers={beers} inventory={inventory} recipes={recipes} createAction={createAction} defaultTankId={newBatchTankId} />
    </div>
  );
}
