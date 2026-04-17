"use client";

import { useState, useTransition } from "react";
import { Dialog } from "@/components/dialog";
import { tankTypes } from "@/lib/options";
import { Batch, Tank } from "@/lib/types";
import { getBatchById, deriveTankStatus, tankTone, formatDate } from "@/lib/utils";

export function TanksManager({
  tanks,
  batches,
  createAction,
  updateAction,
  logCipAction
}: {
  tanks: Tank[];
  batches: Batch[];
  createAction: (formData: FormData) => Promise<void>;
  updateAction: (formData: FormData) => Promise<void>;
  logCipAction: (formData: FormData) => Promise<void>;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTank, setEditingTank] = useState<Tank | null>(null);
  const [cipTankId, setCipTankId] = useState<string | null>(null);
  const [cipDate, setCipDate] = useState("");
  const [form, setForm] = useState({ name: "", type: "Unitank", capacityBbl: "15" });
  const [isDirty, setIsDirty] = useState(false);
  const [, startTransition] = useTransition();

  function openCreate() {
    setEditingTank(null);
    setForm({ name: "", type: "Unitank", capacityBbl: "15" });
    setIsDirty(false);
    setDialogOpen(true);
  }

  function openEdit(tank: Tank) {
    setEditingTank(tank);
    setForm({ name: tank.name, type: tank.type, capacityBbl: tank.capacityBbl.toString() });
    setIsDirty(false);
    setDialogOpen(true);
  }

  function closeDialog() {
    if (isDirty && !confirm("You have unsaved changes. Discard them?")) return;
    setDialogOpen(false);
    setEditingTank(null);
    setIsDirty(false);
  }

  function updateField(name: string, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
    setIsDirty(true);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const action = editingTank ? updateAction : createAction;
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      await action(formData);
      setDialogOpen(false);
      setIsDirty(false);
    });
  }

  function handleCipSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      await logCipAction(formData);
      setCipTankId(null);
      setCipDate("");
    });
  }

  return (
    <div className="space-y-6">
      <section className="panel p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Tank roster</h3>
          <button type="button" onClick={openCreate} className="button-primary">Add tank</button>
        </div>
        <div className="table-shell mt-5">
          <table>
            <thead>
              <tr>
                <th>Tank</th>
                <th>Status</th>
                <th>Current batch</th>
                <th>Last CIP</th>
                <th>Capacity</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tanks.map((tank) => {
                const derivedStatus = deriveTankStatus(tank, batches);
                const batch = getBatchById(batches, tank.currentBatchId) ??
                  batches.find((b) => b.assignedTankId === tank.id && b.stage !== "Completed");
                const isLoggingCip = cipTankId === tank.id;

                return (
                  <tr key={tank.id}>
                    <td>
                      <p className="font-semibold">{tank.name}</p>
                      <p className="text-sm text-muted">{tank.type}</p>
                    </td>
                    <td><span className={`pill ${tankTone(derivedStatus)}`}>{derivedStatus}</span></td>
                    <td>
                      <p>{batch?.beerName ?? "None assigned"}</p>
                      <p className="text-sm text-muted">{batch ? `${batch.batchNumber} • ${batch.stage}` : "Ready for scheduling"}</p>
                    </td>
                    <td>
                      {isLoggingCip ? (
                        <form className="flex items-center gap-2" onSubmit={handleCipSubmit}>
                          <input type="hidden" name="id" value={tank.id} />
                          <input className="input-shell py-1 text-sm" name="lastCipDate" type="date" required value={cipDate} onChange={(e) => setCipDate(e.target.value)} />
                          <button type="submit" className="button-primary py-1 text-xs">Save</button>
                          <button type="button" onClick={() => setCipTankId(null)} className="button-secondary py-1 text-xs">Cancel</button>
                        </form>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{formatDate(tank.lastCipDate)}</span>
                          <button type="button" onClick={() => { setCipTankId(tank.id); setCipDate(""); }} className="text-xs text-muted underline-offset-2 hover:underline">Log CIP</button>
                        </div>
                      )}
                    </td>
                    <td>{tank.capacityBbl} bbl</td>
                    <td><button type="button" onClick={() => openEdit(tank)} className="text-sm text-ink underline-offset-2 hover:underline">Edit</button></td>
                  </tr>
                );
              })}
              {tanks.length === 0 && (
                <tr><td colSpan={6} className="text-sm text-muted">No tanks added yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog title={editingTank ? "Edit tank" : "Add tank"} open={dialogOpen} onClose={closeDialog}>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          {editingTank && <input type="hidden" name="id" value={editingTank.id} />}
          <label className="text-sm">
            <span className="mb-2 block text-muted">Tank name</span>
            <input className="input-shell" name="name" required value={form.name} onChange={(e) => updateField("name", e.target.value)} />
          </label>
          <label className="text-sm">
            <span className="mb-2 block text-muted">Tank type</span>
            <select className="input-shell" name="type" value={form.type} onChange={(e) => updateField("type", e.target.value)}>
              {tankTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-2 block text-muted">Capacity (bbl)</span>
            <input className="input-shell" name="capacityBbl" required type="number" min="0" step="0.1" value={form.capacityBbl} onChange={(e) => updateField("capacityBbl", e.target.value)} />
          </label>
          <div className="flex gap-2">
            <button className="button-primary" type="submit">{editingTank ? "Update tank" : "Add tank"}</button>
            <button type="button" onClick={closeDialog} className="button-secondary">Cancel</button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
