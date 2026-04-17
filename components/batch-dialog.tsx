"use client";

import { useEffect, useState, useTransition } from "react";
import { Dialog } from "@/components/dialog";
import { getBatchLogs } from "@/app/actions/data";
import { Batch, BatchLog, BatchStage, Recipe } from "@/lib/types";
import { formatDate, stageTone } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";

const STAGE_ORDER: BatchStage[] = ["Planned", "Brewing", "Fermenting", "Conditioning", "Packaging", "Completed"];

function today() {
  return new Date().toISOString().slice(0, 10);
}

type EditState = {
  stage: BatchStage;
  actualBrewDate: string;
  actualVolumeBbl: string;
  og: string;
  fg: string;
  abv: string;
  ibu: string;
  notes: string;
  logNote: string;
};

function batchToEditState(batch: Batch): EditState {
  return {
    stage: batch.stage,
    actualBrewDate: batch.actualBrewDate ?? "",
    actualVolumeBbl: batch.actualVolumeBbl?.toString() ?? "",
    og: batch.og?.toString() ?? "",
    fg: batch.fg?.toString() ?? "",
    abv: batch.abv?.toString() ?? "",
    ibu: batch.ibu?.toString() ?? "",
    notes: batch.notes,
    logNote: ""
  };
}

export function BatchDialog({
  batch,
  recipes,
  onClose,
  updateAction,
  deleteAction,
  varianceAction
}: {
  batch: Batch | null;
  recipes: Recipe[];
  onClose: () => void;
  updateAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
  varianceAction: (formData: FormData) => Promise<void>;
}) {
  const { isAdmin } = useAuth();
  const [editState, setEditState] = useState<EditState | null>(null);
  const [logs, setLogs] = useState<BatchLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [ingredientActuals, setIngredientActuals] = useState<Record<string, string>>({});
  const [, startTransition] = useTransition();

  const recipe = batch?.beerId ? recipes.find((r) => r.beerId === batch.beerId) : null;

  useEffect(() => {
    if (!batch) { setLogs([]); setEditState(null); setIngredientActuals({}); return; }
    setEditState(batchToEditState(batch));
    setLogsLoading(true);
    getBatchLogs(batch.id).then((data) => {
      setLogs(data);
      setLogsLoading(false);
    });
  }, [batch]);

  // Pre-fill actuals with scaled expected quantities — only on first load, not after saves
  useEffect(() => {
    if (!recipe || !batch || Object.keys(ingredientActuals).length > 0) return;
    const vol = Number(editState?.actualVolumeBbl) || batch.actualVolumeBbl || batch.targetVolumeBbl;
    const scale = recipe.batchSizeBbl > 0 ? vol / recipe.batchSizeBbl : 1;
    const defaults: Record<string, string> = {};
    recipe.ingredients.forEach((ing) => {
      defaults[ing.inventoryItemId] = +(ing.quantity * scale).toFixed(3) + "";
    });
    setIngredientActuals(defaults);
  }, [recipe, batch?.id]);

  function buildVarianceFormData() {
    if (!batch || !recipe) return null;
    const vol = Number(editState?.actualVolumeBbl) || batch.actualVolumeBbl || batch.targetVolumeBbl;
    const scale = recipe.batchSizeBbl > 0 ? vol / recipe.batchSizeBbl : 1;
    const formData = new FormData();
    formData.set("batchId", batch.id);
    formData.set("beerId", batch.beerId ?? "");
    recipe.ingredients.forEach((ing) => {
      formData.append("ingredientItemId", ing.inventoryItemId);
      formData.append("ingredientActual", ingredientActuals[ing.inventoryItemId] ?? "0");
      formData.append("ingredientExpected", +(ing.quantity * scale).toFixed(3) + "");
    });
    return formData;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!batch || !editState) return;
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const ops: Promise<void>[] = [updateAction(formData)];
      if (isBrewing && recipe && Object.keys(ingredientActuals).length > 0) {
        const vfd = buildVarianceFormData();
        if (vfd) ops.push(varianceAction(vfd));
      }
      await Promise.all(ops);
      onClose();
    });
  }

  function handleVarianceSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const vfd = buildVarianceFormData();
    if (!vfd) return;
    startTransition(async () => {
      await varianceAction(vfd);
    });
  }

  const targetStage = editState?.stage;
  const isCompleted = batch?.stage === "Completed";
  const isBrewing = editState?.stage === "Brewing";

  return (
    <Dialog
      title={batch ? `${batch.beerName} — ${batch.batchNumber}` : ""}
      open={!!batch}
      onClose={onClose}
    >
      {batch && editState && (
        <div className="space-y-6">

          {/* Stage progress */}
          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.15em] text-muted">Lifecycle</p>
            <div className="flex flex-wrap gap-2">
              {STAGE_ORDER.map((s, i) => {
                const currentIdx = STAGE_ORDER.indexOf(targetStage!);
                const isPast = i < currentIdx;
                const isCurrent = s === targetStage;
                return (
                  <span key={s} className={`pill ${isCurrent ? stageTone(s) : isPast ? "pill-success opacity-60" : "pill-neutral opacity-30"}`}>
                    {s}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Batch summary */}
          <div className="grid grid-cols-2 gap-3 border border-[var(--border)] bg-[var(--background)] p-4 text-sm sm:grid-cols-4">
            <div><p className="text-muted">Style</p><p className="mt-1 font-semibold">{batch.style}</p></div>
            <div><p className="text-muted">Brew date</p><p className="mt-1 font-semibold">{formatDate(batch.actualBrewDate ?? batch.plannedBrewDate)}</p></div>
            <div><p className="text-muted">Est. done</p><p className="mt-1 font-semibold">{formatDate(batch.plannedEndDate)}</p></div>
            <div><p className="text-muted">Volume</p><p className="mt-1 font-semibold">{batch.actualVolumeBbl ?? batch.targetVolumeBbl} bbl</p></div>
            <div><p className="text-muted">OG</p><p className="mt-1 font-semibold">{batch.og ?? "—"}</p></div>
            <div><p className="text-muted">FG</p><p className="mt-1 font-semibold">{batch.fg ?? "—"}</p></div>
            <div><p className="text-muted">ABV</p><p className="mt-1 font-semibold">{batch.abv ? `${batch.abv}%` : "—"}</p></div>
            <div><p className="text-muted">IBU</p><p className="mt-1 font-semibold">{batch.ibu ?? "—"}</p></div>
          </div>

          {/* Ingredient variance — only shown when Brewing and recipe exists */}
          {isBrewing && recipe && recipe.ingredients.length > 0 && (
            <form onSubmit={handleVarianceSubmit}>
              <p className="mb-3 text-xs uppercase tracking-[0.15em] text-muted">Ingredient quantities</p>
              <div className="divide-y divide-[var(--border)] border border-[var(--border)]">
                {recipe.ingredients.map((ing) => {
                  const vol = Number(editState?.actualVolumeBbl) || batch.actualVolumeBbl || batch.targetVolumeBbl;
                  const scale = recipe.batchSizeBbl > 0 ? vol / recipe.batchSizeBbl : 1;
                  const expected = +(ing.quantity * scale).toFixed(3);
                  const actual = Number(ingredientActuals[ing.inventoryItemId] ?? expected);
                  const diff = +(actual - expected).toFixed(3);
                  return (
                    <div key={ing.id} className="flex items-center gap-4 px-4 py-3">
                      <span className="flex-1 text-sm">{ing.inventoryItemName}</span>
                      <span className="text-xs text-muted w-24 text-right">expected: {expected} {ing.unit}</span>
                      <input
                        className="input-shell w-24 shrink-0 text-sm"
                        style={{ width: "6rem" }}
                        type="number"
                        min="0"
                        step="0.001"
                        value={ingredientActuals[ing.inventoryItemId] ?? expected}
                        onChange={(e) => setIngredientActuals((s) => ({ ...s, [ing.inventoryItemId]: e.target.value }))}
                      />
                      <span className="text-xs w-16 text-right tabular-nums" style={{ color: diff > 0 ? "var(--danger)" : diff < 0 ? "var(--accent)" : "var(--muted)" }}>
                        {diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
              <button type="submit" className="button-secondary mt-3 text-sm">Save ingredient actuals</button>
            </form>
          )}

          {/* Update form */}
          {!isCompleted && (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <input type="hidden" name="id" value={batch.id} />
              <input type="hidden" name="stage" value={editState.stage} />
              <input type="hidden" name="notes" value={editState.notes} />

              <div className="grid gap-4 lg:grid-cols-2">
                <label className="text-sm lg:col-span-2">
                  <span className="mb-2 block text-muted">Stage</span>
                  <select
                    className="input-shell"
                    value={editState.stage}
                    onChange={(e) => {
                      const next = e.target.value as BatchStage;
                      setEditState((s) => {
                        if (!s) return s;
                        const updates: Partial<EditState> = { stage: next };
                        if (next === "Brewing" && !s.actualBrewDate) updates.actualBrewDate = today();
                        return { ...s, ...updates };
                      });
                      // Seed ingredient actuals when switching to Brewing
                      if (next === "Brewing" && recipe && batch) {
                        const vol = Number(editState?.actualVolumeBbl) || batch.actualVolumeBbl || batch.targetVolumeBbl;
                        const scale = recipe.batchSizeBbl > 0 ? vol / recipe.batchSizeBbl : 1;
                        const defaults: Record<string, string> = {};
                        recipe.ingredients.forEach((ing) => {
                          defaults[ing.inventoryItemId] = +(ing.quantity * scale).toFixed(3) + "";
                        });
                        setIngredientActuals(defaults);
                      }
                    }}
                  >
                    {STAGE_ORDER.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>

                {targetStage !== "Planned" && (
                  <label className="text-sm">
                    <span className="mb-2 block text-muted">Actual brew date</span>
                    <input className="input-shell" name="actualBrewDate" type="date"
                      value={editState.actualBrewDate}
                      onChange={(e) => setEditState((s) => s ? { ...s, actualBrewDate: e.target.value } : s)}
                    />
                  </label>
                )}
                <label className="text-sm">
                  <span className="mb-2 block text-muted">Actual volume (bbl)</span>
                  <input className="input-shell" name="actualVolumeBbl" type="number" step="0.1"
                    value={editState.actualVolumeBbl}
                    onChange={(e) => setEditState((s) => s ? { ...s, actualVolumeBbl: e.target.value } : s)}
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-2 block text-muted">OG</span>
                  <input className="input-shell" name="og" type="number" step="0.001"
                    value={editState.og}
                    onChange={(e) => setEditState((s) => s ? { ...s, og: e.target.value } : s)}
                  />
                </label>
                {STAGE_ORDER.indexOf(targetStage!) >= STAGE_ORDER.indexOf("Conditioning") && (
                  <>
                    <label className="text-sm">
                      <span className="mb-2 block text-muted">FG</span>
                      <input className="input-shell" name="fg" type="number" step="0.001"
                        value={editState.fg}
                        onChange={(e) => setEditState((s) => s ? { ...s, fg: e.target.value } : s)}
                      />
                    </label>
                    <label className="text-sm">
                      <span className="mb-2 block text-muted">ABV</span>
                      <input className="input-shell" name="abv" type="number" step="0.1"
                        value={editState.abv}
                        onChange={(e) => setEditState((s) => s ? { ...s, abv: e.target.value } : s)}
                      />
                    </label>
                    <label className="text-sm">
                      <span className="mb-2 block text-muted">IBU</span>
                      <input className="input-shell" name="ibu" type="number" step="0.1"
                        value={editState.ibu}
                        onChange={(e) => setEditState((s) => s ? { ...s, ibu: e.target.value } : s)}
                      />
                    </label>
                  </>
                )}
              </div>

              <label className="block text-sm">
                <span className="mb-2 block text-muted">Add a note to the log</span>
                <textarea
                  className="input-shell min-h-16"
                  name="logNote"
                  placeholder="What happened at this stage?"
                  value={editState.logNote}
                  onChange={(e) => setEditState((s) => s ? { ...s, logNote: e.target.value } : s)}
                />
              </label>

              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-2">
                  <button className="button-primary" type="submit">Save update</button>
                  <button type="button" onClick={onClose} className="button-secondary">Close</button>
                </div>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!confirm(`Delete ${batch.beerName} (${batch.batchNumber})? This cannot be undone.`)) return;
                      const formData = new FormData();
                      formData.set("id", batch.id);
                      startTransition(async () => {
                        await deleteAction(formData);
                        onClose();
                      });
                    }}
                    className="text-sm text-[var(--danger)] underline-offset-2 hover:underline"
                  >
                    Delete batch
                  </button>
                )}
              </div>
            </form>
          )}

          {/* Log timeline */}
          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.15em] text-muted">Production log</p>
            {logsLoading ? (
              <p className="text-sm text-muted">Loading…</p>
            ) : logs.length === 0 ? (
              <p className="text-sm text-muted">No log entries yet.</p>
            ) : (
              <div className="space-y-0">
                {logs.map((log, i) => (
                  <div key={log.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-[var(--accent)]" />
                      {i < logs.length - 1 && <div className="w-px flex-1 bg-[var(--border)]" />}
                    </div>
                    <div className="pb-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`pill text-xs ${stageTone(log.stage as BatchStage)}`}>{log.stage}</span>
                        <span className="text-xs text-muted">{formatDate(log.createdAt.slice(0, 10))}</span>
                        <span className="text-xs text-muted">by {log.createdBy}</span>
                      </div>
                      {log.note && <p className="mt-2 text-sm leading-6">{log.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {isCompleted && (
            <button type="button" onClick={onClose} className="button-secondary w-full">Close</button>
          )}
        </div>
      )}
    </Dialog>
  );
}
