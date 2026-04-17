"use client";

import { useEffect, useState, useTransition } from "react";
import { Dialog } from "@/components/dialog";
import { getBatchLogs } from "@/app/actions/data";
import { Batch, BatchLog, BatchStage } from "@/lib/types";
import { deriveTankStatus, formatDate, stageTone, tankTone } from "@/lib/utils";
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
  onClose,
  updateAction,
  deleteAction
}: {
  batch: Batch | null;
  onClose: () => void;
  updateAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
}) {
  const { isAdmin } = useAuth();
  const [editState, setEditState] = useState<EditState | null>(null);
  const [logs, setLogs] = useState<BatchLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!batch) { setLogs([]); setEditState(null); return; }
    setEditState(batchToEditState(batch));
    setLogsLoading(true);
    getBatchLogs(batch.id).then((data) => {
      setLogs(data);
      setLogsLoading(false);
    });
  }, [batch]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!batch || !editState) return;
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      await updateAction(formData);
      onClose();
    });
  }

  const targetStage = editState?.stage;
  const isCompleted = batch?.stage === "Completed";

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

          {/* Batch summary (read-only header) */}
          <div className="grid grid-cols-2 gap-3 border border-[var(--border)] bg-[var(--background)] p-4 text-sm sm:grid-cols-4">
            <div>
              <p className="text-muted">Style</p>
              <p className="mt-1 font-semibold">{batch.style}</p>
            </div>
            <div>
              <p className="text-muted">Brew date</p>
              <p className="mt-1 font-semibold">{formatDate(batch.actualBrewDate ?? batch.plannedBrewDate)}</p>
            </div>
            <div>
              <p className="text-muted">Est. done</p>
              <p className="mt-1 font-semibold">{formatDate(batch.plannedEndDate)}</p>
            </div>
            <div>
              <p className="text-muted">Volume</p>
              <p className="mt-1 font-semibold">{batch.actualVolumeBbl ?? batch.targetVolumeBbl} bbl</p>
            </div>
            <div>
              <p className="text-muted">OG</p>
              <p className="mt-1 font-semibold">{batch.og ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted">FG</p>
              <p className="mt-1 font-semibold">{batch.fg ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted">ABV</p>
              <p className="mt-1 font-semibold">{batch.abv ? `${batch.abv}%` : "—"}</p>
            </div>
            <div>
              <p className="text-muted">IBU</p>
              <p className="mt-1 font-semibold">{batch.ibu ?? "—"}</p>
            </div>
          </div>

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
