"use client";

import { useState, useTransition } from "react";
import { Dialog } from "@/components/dialog";
import { packageTypes } from "@/lib/options";
import { Batch } from "@/lib/types";
import { formatDate } from "@/lib/utils";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function LogPackagingDialog({
  batch,
  onClose,
  updateAction
}: {
  batch: Batch | null;
  onClose: () => void;
  updateAction: (formData: FormData) => Promise<void>;
}) {
  const [packageType, setPackageType] = useState("");
  const [packageDate, setPackageDate] = useState(today());
  const [packagedUnits, setPackagedUnits] = useState("");
  const [markCompleted, setMarkCompleted] = useState(false);
  const [logNote, setLogNote] = useState("");
  const [, startTransition] = useTransition();

  // Reset when batch changes
  if (batch && packageType === "" && batch.packageType) {
    setPackageType(batch.packageType);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!batch) return;

    const fd = new FormData();
    fd.set("id", batch.id);
    fd.set("stage", markCompleted ? "Completed" : "Packaging");
    fd.set("packageType", packageType);
    fd.set("packageDate", packageDate);
    fd.set("packagedUnits", packagedUnits);
    fd.set("logNote", logNote || `Packaged ${packagedUnits} ${packageType} units on ${formatDate(packageDate)}.`);
    // Preserve existing fields
    fd.set("notes", batch.notes);
    if (batch.actualBrewDate) fd.set("actualBrewDate", batch.actualBrewDate);
    if (batch.actualVolumeBbl) fd.set("actualVolumeBbl", batch.actualVolumeBbl.toString());
    if (batch.og) fd.set("og", batch.og.toString());
    if (batch.fg) fd.set("fg", batch.fg.toString());
    if (batch.abv) fd.set("abv", batch.abv.toString());
    if (batch.ibu) fd.set("ibu", batch.ibu.toString());

    startTransition(async () => {
      await updateAction(fd);
      onClose();
    });
  }

  if (!batch) return null;

  const volumeBbl = batch.actualVolumeBbl ?? batch.targetVolumeBbl;

  return (
    <Dialog title={`Log packaging — ${batch.beerName}`} open={!!batch} onClose={onClose}>
      <div className="space-y-5">
        {/* Batch context */}
        <div className="grid grid-cols-3 gap-3 border border-[var(--border)] bg-[var(--background)] p-3 text-sm">
          <div><p className="text-muted">Batch</p><p className="mt-1 font-semibold">{batch.batchNumber}</p></div>
          <div><p className="text-muted">Volume</p><p className="mt-1 font-semibold">{volumeBbl} bbl</p></div>
          <div><p className="text-muted">ABV</p><p className="mt-1 font-semibold">{batch.abv ? `${batch.abv}%` : "—"}</p></div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-2 block text-muted">Package type</span>
              <select className="input-shell" value={packageType} onChange={(e) => setPackageType(e.target.value)} required>
                <option value="">Select type</option>
                {packageTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-2 block text-muted">Package date</span>
              <input className="input-shell" type="date" value={packageDate} onChange={(e) => setPackageDate(e.target.value)} required />
            </label>
            <label className="text-sm sm:col-span-2">
              <span className="mb-2 block text-muted">
                Units packaged
                {packageType && volumeBbl && (
                  <span className="ml-2 text-xs text-muted">
                    ({volumeBbl} bbl → ~{packageType === "Keg" ? Math.round(volumeBbl * 2) : Math.round(volumeBbl * 13.78)} {packageType === "Keg" ? "half-barrels" : "cases"})
                  </span>
                )}
              </span>
              <input className="input-shell" type="number" min="0" placeholder="0" value={packagedUnits} onChange={(e) => setPackagedUnits(e.target.value)} required />
            </label>
          </div>

          <label className="block text-sm">
            <span className="mb-2 block text-muted">Note (optional)</span>
            <textarea className="input-shell min-h-16" placeholder="Any notes about this packaging run…" value={logNote} onChange={(e) => setLogNote(e.target.value)} />
          </label>

          <label className="flex cursor-pointer items-center gap-3 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[var(--accent)]"
              checked={markCompleted}
              onChange={(e) => setMarkCompleted(e.target.checked)}
            />
            <span>Mark batch as completed after packaging</span>
          </label>

          <div className="flex gap-2">
            <button className="button-primary" type="submit">Save packaging run</button>
            <button type="button" onClick={onClose} className="button-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </Dialog>
  );
}
