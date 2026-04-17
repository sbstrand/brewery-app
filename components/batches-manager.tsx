"use client";

import { useState } from "react";
import { BatchDialog } from "@/components/batch-dialog";
import { NewBatchDialog } from "@/components/new-batch-dialog";
import { Batch, Beer, InventoryItem, Recipe, Tank } from "@/lib/types";
import { formatDate, getTankById, stageTone } from "@/lib/utils";

export function BatchesManager({
  batches,
  tanks,
  beers,
  inventory,
  recipes,
  createAction,
  updateAction,
  deleteAction,
  varianceAction
}: {
  batches: Batch[];
  tanks: Tank[];
  beers: Beer[];
  inventory: InventoryItem[];
  recipes: Recipe[];
  createAction: (formData: FormData) => Promise<void>;
  updateAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
  varianceAction: (formData: FormData) => Promise<void>;
}) {
  const [newBatchOpen, setNewBatchOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);

  return (
    <div className="space-y-6">
      <section className="panel p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">All batches</h3>
          <button type="button" onClick={() => setNewBatchOpen(true)} className="button-primary">
            New batch
          </button>
        </div>
        <div className="table-shell mt-5">
          <table>
            <thead>
              <tr>
                <th>Batch</th>
                <th>Stage</th>
                <th>Tank</th>
                <th>Volume</th>
                <th>Metrics</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {batches.map((batch) => (
                <tr key={batch.id}>
                  <td>
                    <p className="font-semibold">{batch.beerName}</p>
                    <p className="text-sm text-muted">{batch.batchNumber} • {batch.style}</p>
                    <p className="mt-2 text-sm text-muted">Brew date: {formatDate(batch.actualBrewDate ?? batch.plannedBrewDate)}</p>
                    {batch.plannedEndDate && <p className="text-sm text-muted">Est. done: {formatDate(batch.plannedEndDate)}</p>}
                  </td>
                  <td><span className={`pill ${stageTone(batch.stage)}`}>{batch.stage}</span></td>
                  <td>{getTankById(tanks, batch.assignedTankId)?.name ?? "Unassigned"}</td>
                  <td>
                    <p>{batch.targetVolumeBbl} bbl target</p>
                    <p className="text-sm text-muted">{batch.actualVolumeBbl ? `${batch.actualVolumeBbl} bbl actual` : "Actual pending"}</p>
                  </td>
                  <td>
                    <p className="text-sm">OG: {batch.og ?? "Pending"}</p>
                    <p className="text-sm">FG: {batch.fg ?? "Pending"}</p>
                    <p className="text-sm">ABV: {batch.abv ?? "Pending"}</p>
                    <p className="text-sm">IBU: {batch.ibu ?? "Pending"}</p>
                  </td>
                  <td>
                    <button type="button" onClick={() => setEditingBatch(batch)} className="text-sm text-ink underline-offset-2 hover:underline">
                      {batch.stage === "Completed" ? "View" : "Update"}
                    </button>
                  </td>
                </tr>
              ))}
              {batches.length === 0 && (
                <tr><td colSpan={6} className="text-sm text-muted">No batches yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <NewBatchDialog
        open={newBatchOpen}
        onClose={() => setNewBatchOpen(false)}
        batches={batches}
        tanks={tanks}
        beers={beers}
        inventory={inventory}
        recipes={recipes}
        createAction={createAction}
      />

      <BatchDialog batch={editingBatch} recipes={recipes} onClose={() => setEditingBatch(null)} updateAction={updateAction} deleteAction={deleteAction} varianceAction={varianceAction} />
    </div>
  );
}
