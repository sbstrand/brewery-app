"use client";

import { useMemo, useState, useTransition } from "react";
import { Dialog } from "@/components/dialog";
import { batchStages, packageTypes } from "@/lib/options";
import { Batch, Beer, Tank } from "@/lib/types";
import { generateBatchNumber } from "@/lib/utils";

const emptyForm = (tankId = "") => ({
  beerId: "", stage: "Planned", plannedBrewDate: "", plannedEndDate: "",
  assignedTankId: tankId, targetVolumeBbl: "",
  packageType: "", notes: ""
});

export function NewBatchDialog({
  open,
  onClose,
  batches,
  tanks,
  beers,
  createAction,
  defaultTankId = ""
}: {
  open: boolean;
  onClose: () => void;
  batches: Batch[];
  tanks: Tank[];
  beers: Beer[];
  createAction: (formData: FormData) => Promise<void>;
  defaultTankId?: string;
}) {
  const [form, setForm] = useState(() => emptyForm(defaultTankId));
  const [, startTransition] = useTransition();

  // Reset form when dialog opens, pre-filling tank if provided
  useMemo(() => {
    if (open) setForm(emptyForm(defaultTankId));
  }, [open, defaultTankId]);

  const selectedBeer = useMemo(() => beers.find((b) => b.id === form.beerId), [beers, form.beerId]);

  // Pre-fill volume from default tank
  const defaultTank = useMemo(() => tanks.find((t) => t.id === defaultTankId), [tanks, defaultTankId]);
  useMemo(() => {
    if (defaultTank && !form.targetVolumeBbl) {
      setForm((f) => ({ ...f, targetVolumeBbl: defaultTank.capacityBbl.toString() }));
    }
  }, [defaultTank]);

  const unavailableTankIds = useMemo(() => {
    const start = form.plannedBrewDate;
    const end = form.plannedEndDate;
    if (!start) return new Set<string>();
    return new Set(
      batches
        .filter((b) => b.stage !== "Completed" && b.assignedTankId)
        .filter((b) => {
          const bStart = b.plannedBrewDate;
          const bEnd = b.plannedEndDate ?? b.plannedBrewDate;
          const newEnd = end || start;
          return !(newEnd < bStart || start > bEnd);
        })
        .map((b) => b.assignedTankId!)
    );
  }, [batches, form.plannedBrewDate, form.plannedEndDate]);

  function updateField(name: string, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function calcEndDate(startDate: string, days: number | undefined): string {
    if (!startDate || !days) return "";
    const d = new Date(startDate);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  function handleBeerChange(beerId: string) {
    const beer = beers.find((b) => b.id === beerId);
    setForm((current) => ({
      ...current,
      beerId,
      packageType: beer?.defaultPackageType ?? "",
      plannedEndDate: calcEndDate(current.plannedBrewDate, beer?.productionDays)
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      await createAction(formData);
      onClose();
    });
  }

  return (
    <Dialog title="New production run" open={open} onClose={onClose}>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-muted">
          Next batch: <span className="font-semibold text-ink">{generateBatchNumber(batches)}</span>
        </span>
      </div>
      <form className="grid gap-4 lg:grid-cols-2" onSubmit={handleSubmit}>
        <label className="text-sm lg:col-span-2">
          <span className="mb-2 block text-muted">Beer</span>
          <select className="input-shell" name="beerId" required value={form.beerId} onChange={(e) => handleBeerChange(e.target.value)}>
            <option value="">Select a beer</option>
            {beers.filter((b) => b.active).map((beer) => <option key={beer.id} value={beer.id}>{beer.name}</option>)}
          </select>
          {selectedBeer && (
            <>
              <input type="hidden" name="beerName" value={selectedBeer.name} />
              <input type="hidden" name="style" value={selectedBeer.style} />
            </>
          )}
        </label>
        <label className="text-sm">
          <span className="mb-2 block text-muted">Planned brew date</span>
          <input className="input-shell" name="plannedBrewDate" required type="date" value={form.plannedBrewDate}
            onChange={(e) => {
              const startDate = e.target.value;
              const beer = beers.find((b) => b.id === form.beerId);
              setForm((current) => ({
                ...current,
                plannedBrewDate: startDate,
                plannedEndDate: calcEndDate(startDate, beer?.productionDays)
              }));
            }}
          />
        </label>
        <label className="text-sm">
          <span className="mb-2 block text-muted">
            Planned end date{selectedBeer?.productionDays ? ` (${selectedBeer.productionDays} days)` : ""}
          </span>
          <input className="input-shell" name="plannedEndDate" type="date" value={form.plannedEndDate}
            onChange={(e) => updateField("plannedEndDate", e.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="mb-2 block text-muted">Stage</span>
          <select className="input-shell" name="stage" value={form.stage} onChange={(e) => updateField("stage", e.target.value)}>
            {batchStages.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-2 block text-muted">Assigned tank</span>
          <select
            className="input-shell"
            name="assignedTankId"
            value={form.assignedTankId}
            onChange={(e) => {
              const tank = tanks.find((t) => t.id === e.target.value);
              setForm((current) => ({
                ...current,
                assignedTankId: e.target.value,
                targetVolumeBbl: tank ? tank.capacityBbl.toString() : current.targetVolumeBbl
              }));
            }}
          >
            <option value="">Unassigned</option>
            {tanks.map((tank) => {
              const unavailable = unavailableTankIds.has(tank.id);
              return (
                <option key={tank.id} value={tank.id} disabled={unavailable}>
                  {tank.name} ({tank.type}){unavailable ? " — scheduled" : ""}
                </option>
              );
            })}
          </select>
          {form.assignedTankId && unavailableTankIds.has(form.assignedTankId) && (
            <p className="mt-1 text-xs text-[var(--danger)]">This tank is already scheduled during this period.</p>
          )}
        </label>
        <label className="text-sm">
          <span className="mb-2 block text-muted">Target volume (bbl)</span>
          <input className="input-shell" name="targetVolumeBbl" required type="number" min="0" step="0.1" value={form.targetVolumeBbl} onChange={(e) => updateField("targetVolumeBbl", e.target.value)} />
        </label>
        <label className="text-sm">
          <span className="mb-2 block text-muted">Package type</span>
          <select className="input-shell" name="packageType" value={form.packageType} onChange={(e) => updateField("packageType", e.target.value)}>
            <option value="">Not set</option>
            {packageTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>
        <label className="text-sm lg:col-span-2">
          <span className="mb-2 block text-muted">Notes</span>
          <textarea className="input-shell min-h-20" name="notes" value={form.notes} onChange={(e) => updateField("notes", e.target.value)} />
        </label>
        <div className="flex gap-2 lg:col-span-2">
          <button className="button-primary" type="submit">Add batch</button>
          <button type="button" onClick={onClose} className="button-secondary">Cancel</button>
        </div>
      </form>
    </Dialog>
  );
}
