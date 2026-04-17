"use client";

import { useState, useTransition } from "react";
import { Dialog } from "@/components/dialog";
import { packageTypes } from "@/lib/options";
import { Beer } from "@/lib/types";

const emptyForm = { name: "", style: "", productionDays: "", targetAbv: "", targetIbu: "", defaultPackageType: "", notes: "" };

export function BeersManager({
  beers,
  createAction,
  updateAction,
  toggleActiveAction
}: {
  beers: Beer[];
  createAction: (formData: FormData) => Promise<void>;
  updateAction: (formData: FormData) => Promise<void>;
  toggleActiveAction: (formData: FormData) => Promise<void>;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBeer, setEditingBeer] = useState<Beer | null>(null);
  const [, startToggleTransition] = useTransition();
  const [form, setForm] = useState(emptyForm);
  const [isDirty, setIsDirty] = useState(false);
  const [, startTransition] = useTransition();

  function openCreate() {
    setEditingBeer(null);
    setForm(emptyForm);
    setIsDirty(false);
    setDialogOpen(true);
  }

  function openEdit(beer: Beer) {
    setEditingBeer(beer);
    setForm({
      name: beer.name,
      style: beer.style,
      productionDays: beer.productionDays?.toString() ?? "",
      targetAbv: beer.targetAbv?.toString() ?? "",
      targetIbu: beer.targetIbu?.toString() ?? "",
      defaultPackageType: beer.defaultPackageType ?? "",
      notes: beer.notes
    });
    setIsDirty(false);
    setDialogOpen(true);
  }

  function closeDialog() {
    if (isDirty && !confirm("You have unsaved changes. Discard them?")) return;
    setDialogOpen(false);
    setEditingBeer(null);
    setIsDirty(false);
  }

  function updateField(name: string, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
    setIsDirty(true);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const action = editingBeer ? updateAction : createAction;
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      await action(formData);
      setDialogOpen(false);
      setIsDirty(false);
    });
  }

  return (
    <div className="space-y-6">
      <section className="panel p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Beer catalog</h3>
          <button type="button" onClick={openCreate} className="button-primary">Add beer</button>
        </div>
        <div className="table-shell mt-5">
          <table>
            <thead>
              <tr>
                <th>Beer</th>
                <th>Production days</th>
                <th>Targets</th>
                <th>Package</th>
                <th>Notes</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {beers.map((beer) => (
                <tr key={beer.id} className={!beer.active ? "opacity-50" : ""}>
                  <td>
                    <p className="font-semibold">{beer.name}</p>
                    <p className="text-sm text-muted">{beer.style}</p>
                  </td>
                  <td>{beer.productionDays ? `${beer.productionDays} days` : "—"}</td>
                  <td>
                    <p className="text-sm">OG: {beer.targetOg ?? "—"}</p>
                    <p className="text-sm">FG: {beer.targetFg ?? "—"}</p>
                    <p className="text-sm">ABV: {beer.targetAbv ?? "—"}</p>
                    <p className="text-sm">IBU: {beer.targetIbu ?? "—"}</p>
                  </td>
                  <td>{beer.defaultPackageType ?? "—"}</td>
                  <td className="text-sm text-muted">{beer.notes || "—"}</td>
                  <td>
                    <span className={`pill text-xs ${beer.active ? "pill-success" : "pill-neutral"}`}>
                      {beer.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => openEdit(beer)} className="text-sm text-ink underline-offset-2 hover:underline">Edit</button>
                      <button
                        type="button"
                        onClick={() => {
                          const fd = new FormData();
                          fd.set("id", beer.id);
                          fd.set("active", String(!beer.active));
                          startToggleTransition(() => toggleActiveAction(fd));
                        }}
                        className="text-sm text-muted underline-offset-2 hover:underline"
                      >
                        {beer.active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {beers.length === 0 && (
                <tr><td colSpan={5} className="text-sm text-muted">No beers in the catalog yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog title={editingBeer ? "Edit beer" : "Add beer"} open={dialogOpen} onClose={closeDialog}>
        <form className="grid gap-4 lg:grid-cols-2" onSubmit={handleSubmit}>
          {editingBeer && <input type="hidden" name="id" value={editingBeer.id} />}
          <label className="text-sm">
            <span className="mb-2 block text-muted">Beer name</span>
            <input className="input-shell" name="name" required value={form.name} onChange={(e) => updateField("name", e.target.value)} />
          </label>
          <label className="text-sm">
            <span className="mb-2 block text-muted">Style</span>
            <input className="input-shell" name="style" required value={form.style} onChange={(e) => updateField("style", e.target.value)} />
          </label>
          <label className="text-sm">
            <span className="mb-2 block text-muted">Production time (days)</span>
            <input className="input-shell" name="productionDays" type="number" min="1" step="1" value={form.productionDays} onChange={(e) => updateField("productionDays", e.target.value)} />
          </label>
          <label className="text-sm">
            <span className="mb-2 block text-muted">Target ABV</span>
            <input className="input-shell" name="targetAbv" type="number" step="0.1" value={form.targetAbv} onChange={(e) => updateField("targetAbv", e.target.value)} />
          </label>
          <label className="text-sm">
            <span className="mb-2 block text-muted">Target IBU</span>
            <input className="input-shell" name="targetIbu" type="number" step="0.1" value={form.targetIbu} onChange={(e) => updateField("targetIbu", e.target.value)} />
          </label>
          <label className="text-sm">
            <span className="mb-2 block text-muted">Default package type</span>
            <select className="input-shell" name="defaultPackageType" value={form.defaultPackageType} onChange={(e) => updateField("defaultPackageType", e.target.value)}>
              <option value="">Not set</option>
              {packageTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="text-sm lg:col-span-2">
            <span className="mb-2 block text-muted">Notes</span>
            <textarea className="input-shell min-h-20" name="notes" value={form.notes} onChange={(e) => updateField("notes", e.target.value)} />
          </label>
          <div className="flex gap-2 lg:col-span-2">
            <button className="button-primary" type="submit">{editingBeer ? "Update beer" : "Add beer"}</button>
            <button type="button" onClick={closeDialog} className="button-secondary">Cancel</button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
