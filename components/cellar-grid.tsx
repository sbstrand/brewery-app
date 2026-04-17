"use client";

import { useTransition } from "react";
import { Batch, Tank } from "@/lib/types";
import { deriveTankStatus, formatDate, stageTone, tankTone } from "@/lib/utils";

export function CellarGrid({
  tanks,
  batches,
  dragBatchId,
  dropTargetId,
  onTankClick,
  onAvailableClick,
  onDragStart,
  onDragEnd,
  onDropTargetChange,
  reassignAction
}: {
  tanks: Tank[];
  batches: Batch[];
  dragBatchId: string | null;
  dropTargetId: string | null;
  onTankClick: (batch: Batch) => void;
  onAvailableClick: (tankId: string) => void;
  onDragStart: (batchId: string) => void;
  onDragEnd: () => void;
  onDropTargetChange: (tankId: string | null) => void;
  reassignAction: (formData: FormData) => Promise<void>;
}) {
  const [, startTransition] = useTransition();

  function handleDragOver(e: React.DragEvent, tankId: string, canDrop: boolean) {
    if (!canDrop || !dragBatchId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    onDropTargetChange(tankId);
  }

  function handleDrop(e: React.DragEvent, targetTank: Tank) {
    e.preventDefault();
    onDropTargetChange(null);
    if (!dragBatchId) return;

    const batch = batches.find((b) => b.id === dragBatchId);
    if (!batch) return;

    const oldTank = tanks.find((t) => t.id === batch.assignedTankId);
    const fd = new FormData();
    fd.set("batchId", batch.id);
    fd.set("newTankId", targetTank.id);
    fd.set("newTankName", targetTank.name);
    if (oldTank) fd.set("oldTankName", oldTank.name);

    startTransition(() => reassignAction(fd));
    onDragEnd();
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {tanks.length === 0 ? (
        <p className="text-sm text-muted">No tanks have been added yet.</p>
      ) : tanks.map((tank) => {
        const status = deriveTankStatus(tank, batches);
        const activeBatch = batches.find((b) => b.assignedTankId === tank.id && b.stage !== "Completed");
        const isAvailable = status === "Available";
        const isDragging = activeBatch && dragBatchId === activeBatch.id;
        const isDropTarget = dropTargetId === tank.id;
        const canDrop = isAvailable && !!dragBatchId;

        return (
          <div
            key={tank.id}
            onDragOver={(e) => handleDragOver(e, tank.id, canDrop)}
            onDragLeave={() => onDropTargetChange(null)}
            onDrop={(e) => canDrop ? handleDrop(e, tank) : undefined}
            className={`border p-4 text-left transition select-none ${
              isDropTarget
                ? "border-[var(--accent)] bg-[rgba(201,168,76,0.08)] ring-2 ring-[var(--accent)]"
                : activeBatch
                ? "border-[var(--border)] bg-[var(--surface)]"
                : isAvailable
                ? "border-dashed border-[var(--border)] bg-[var(--surface-contrast)]"
                : "border-[var(--border)] bg-[var(--surface-contrast)] opacity-50"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-lg font-semibold">{tank.name}</p>
              {status !== "In Use" && (
                <span className={`pill text-xs ${tankTone(status)}`}>{status}</span>
              )}
            </div>

            {activeBatch ? (
              <div
                draggable
                onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; onDragStart(activeBatch.id); }}
                onDragEnd={onDragEnd}
                onClick={() => onTankClick(activeBatch)}
                className={`mt-3 cursor-grab space-y-1 rounded active:cursor-grabbing ${isDragging ? "opacity-40" : "hover:opacity-80"} transition`}
                title="Drag to move to another tank"
              >
                <p className="font-semibold text-ink">{activeBatch.beerName}</p>
                <p className="text-sm text-muted">{activeBatch.batchNumber}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`pill text-xs ${stageTone(activeBatch.stage)}`}>{activeBatch.stage}</span>
                  {activeBatch.abv && <span className="text-xs text-muted">ABV {activeBatch.abv}%</span>}
                </div>
                {activeBatch.stage === "Planned" ? (
                  <p className="mt-1 text-xs text-muted">Planned brew date: {formatDate(activeBatch.plannedBrewDate)}</p>
                ) : (
                  <p className="mt-1 text-xs text-muted">
                    Began {activeBatch.stage.toLowerCase()} on: {formatDate(activeBatch.updatedAt ?? activeBatch.actualBrewDate ?? activeBatch.plannedBrewDate)}
                  </p>
                )}
                <p className="mt-2 text-xs text-muted opacity-60">⠿ Drag to reassign tank</p>
              </div>
            ) : isAvailable ? (
              <button
                type="button"
                onClick={() => onAvailableClick(tank.id)}
                className={`mt-3 w-full text-left text-sm transition ${dragBatchId ? "text-[var(--accent)] font-medium" : "text-muted hover:text-ink"}`}
              >
                {dragBatchId ? "Drop here to assign" : "Tap to schedule a batch"}
              </button>
            ) : (
              <p className="mt-3 text-sm text-muted">{status}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
