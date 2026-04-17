"use client";

import { useEffect, useState, useTransition } from "react";
import { Dialog } from "@/components/dialog";
import { getInventoryAdjustments } from "@/app/actions/data";
import { inventoryCategories } from "@/lib/options";
import { AdjustmentType, Batch, InventoryAdjustment, InventoryItem } from "@/lib/types";
import { formatDate, inventoryHealth } from "@/lib/utils";

const ADJUSTMENT_TYPES: { value: AdjustmentType; label: string; sign: 1 | -1 }[] = [
  { value: "received", label: "Received", sign: 1 },
  { value: "used", label: "Used in production", sign: -1 },
  { value: "waste", label: "Waste / loss", sign: -1 },
  { value: "correction", label: "Correction", sign: 1 }
];

const emptyAdd = { name: "", category: "Malt", onHand: "0", unit: "", reorderThreshold: "0", supplier: "" };

function typePill(type: AdjustmentType) {
  switch (type) {
    case "received": return "pill-success";
    case "used": return "pill-neutral";
    case "waste": return "pill-danger";
    case "correction": return "pill-warning";
  }
}

export function InventoryManager({
  inventory,
  batches,
  createAction,
  updateAction,
  adjustAction
}: {
  inventory: InventoryItem[];
  batches: Batch[];
  createAction: (formData: FormData) => Promise<void>;
  updateAction: (formData: FormData) => Promise<void>;
  adjustAction: (formData: FormData) => Promise<void>;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null);
  const [adjustments, setAdjustments] = useState<InventoryAdjustment[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [addForm, setAddForm] = useState(emptyAdd);
  const [editForm, setEditForm] = useState({ name: "", category: "Malt", unit: "", reorderThreshold: "", supplier: "" });
  const [adjForm, setAdjForm] = useState({ adjustmentType: "received", amount: "", reason: "", batchId: "" });
  const [isDirty, setIsDirty] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!historyItem) { setAdjustments([]); return; }
    setHistoryLoading(true);
    getInventoryAdjustments(historyItem.id).then((data) => {
      setAdjustments(data);
      setHistoryLoading(false);
    });
  }, [historyItem]);

  function openEdit(item: InventoryItem) {
    setEditItem(item);
    setEditForm({ name: item.name, category: item.category, unit: item.unit, reorderThreshold: item.reorderThreshold.toString(), supplier: item.supplier });
    setIsDirty(false);
  }

  function openAdjust(item: InventoryItem) {
    setAdjustItem(item);
    setAdjForm({ adjustmentType: "received", amount: "", reason: "", batchId: "" });
  }

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await createAction(fd);
      setAddForm(emptyAdd);
      setAddOpen(false);
    });
  }

  function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editItem) return;
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await updateAction(fd);
      setEditItem(null);
    });
  }

  function handleAdjust(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!adjustItem) return;
    const type = ADJUSTMENT_TYPES.find((t) => t.value === adjForm.adjustmentType)!;
    const fd = new FormData();
    fd.set("itemId", adjustItem.id);
    fd.set("amount", (type.sign * Math.abs(Number(adjForm.amount))).toString());
    fd.set("adjustmentType", adjForm.adjustmentType);
    fd.set("reason", adjForm.reason);
    if (adjForm.batchId) fd.set("batchId", adjForm.batchId);
    startTransition(async () => {
      await adjustAction(fd);
      setAdjustItem(null);
    });
  }

  const activeBatches = batches.filter((b) => b.stage !== "Completed");

  type SortKey = "name" | "onHand" | "reorderThreshold" | "supplier" | "status";
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span className="ml-1 opacity-30">↕</span>;
    return <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  const sortedInventory = [...inventory].sort((a, b) => {
    let av: string | number, bv: string | number;
    switch (sortKey) {
      case "name": av = a.name; bv = b.name; break;
      case "onHand": av = a.onHand; bv = b.onHand; break;
      case "reorderThreshold": av = a.reorderThreshold; bv = b.reorderThreshold; break;
      case "supplier": av = a.supplier; bv = b.supplier; break;
      case "status": av = inventoryHealth(a); bv = inventoryHealth(b); break;
    }
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  // Group by category, preserving sort within each group
  const grouped = sortedInventory.reduce<Record<string, InventoryItem[]>>((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});

  const categoryOrder = ["Malt", "Hops", "Yeast", "Adjunct", "Cans", "Kegs", "Labels"];
  const categories = categoryOrder.filter((c) => grouped[c]);
  // Any categories not in the predefined order go at the end
  Object.keys(grouped).forEach((c) => { if (!categoryOrder.includes(c)) categories.push(c); });

  return (
    <div className="space-y-6">
      <section className="panel p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Tracked stock</h3>
          <button type="button" onClick={() => setAddOpen(true)} className="button-primary">Add item</button>
        </div>
        <div className="table-shell mt-5">
          <table>
            <thead>
              <tr>
                <th><button type="button" onClick={() => toggleSort("name")} className="flex items-center text-left hover:text-ink">Item<SortIcon col="name" /></button></th>
                <th>Category</th>
                <th><button type="button" onClick={() => toggleSort("onHand")} className="flex items-center hover:text-ink">On hand<SortIcon col="onHand" /></button></th>
                <th><button type="button" onClick={() => toggleSort("reorderThreshold")} className="flex items-center hover:text-ink">Threshold<SortIcon col="reorderThreshold" /></button></th>
                <th><button type="button" onClick={() => toggleSort("supplier")} className="flex items-center hover:text-ink">Supplier<SortIcon col="supplier" /></button></th>
                <th><button type="button" onClick={() => toggleSort("status")} className="flex items-center hover:text-ink">Status<SortIcon col="status" /></button></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <>
                  <tr key={`cat-${category}`}>
                    <td colSpan={7} className="bg-[rgba(122,90,58,0.05)] py-2 px-3">
                      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{category}</span>
                    </td>
                  </tr>
                  {grouped[category].map((item) => {
                    const low = inventoryHealth(item) === "low";
                    return (
                      <tr key={item.id}>
                        <td>
                          <button type="button" onClick={() => setHistoryItem(item)} className="font-semibold text-left underline-offset-2 hover:underline">
                            {item.name}
                          </button>
                        </td>
                        <td className="text-muted text-sm">{item.category}</td>
                        <td>{item.onHand} {item.unit}</td>
                        <td>{item.reorderThreshold} {item.unit}</td>
                        <td>{item.supplier}</td>
                        <td><span className={`pill ${low ? "pill-warning" : "pill-success"}`}>{low ? "Reorder soon" : "Healthy"}</span></td>
                        <td>
                          <div className="flex gap-3">
                            <button type="button" onClick={() => openAdjust(item)} className="text-sm text-ink underline-offset-2 hover:underline">Adjust</button>
                            <button type="button" onClick={() => openEdit(item)} className="text-sm text-muted underline-offset-2 hover:underline">Edit</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </>
              ))}
              {inventory.length === 0 && (
                <tr><td colSpan={7} className="text-sm text-muted">No inventory items yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add item dialog */}
      <Dialog title="Add inventory item" open={addOpen} onClose={() => setAddOpen(false)}>
        <form className="grid gap-4 lg:grid-cols-2" onSubmit={handleAdd}>
          <label className="text-sm">
            <span className="mb-2 block text-muted">Item name</span>
            <input className="input-shell" name="name" required value={addForm.name} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))} />
          </label>
          <label className="text-sm">
            <span className="mb-2 block text-muted">Category</span>
            <select className="input-shell" name="category" value={addForm.category} onChange={(e) => setAddForm((f) => ({ ...f, category: e.target.value }))}>
              {inventoryCategories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-2 block text-muted">On hand</span>
            <input className="input-shell" name="onHand" required type="number" min="0" step="0.1" value={addForm.onHand} onChange={(e) => setAddForm((f) => ({ ...f, onHand: e.target.value }))} />
          </label>
          <label className="text-sm">
            <span className="mb-2 block text-muted">Unit</span>
            <input className="input-shell" name="unit" required value={addForm.unit} onChange={(e) => setAddForm((f) => ({ ...f, unit: e.target.value }))} />
          </label>
          <label className="text-sm">
            <span className="mb-2 block text-muted">Reorder threshold</span>
            <input className="input-shell" name="reorderThreshold" required type="number" min="0" step="0.1" value={addForm.reorderThreshold} onChange={(e) => setAddForm((f) => ({ ...f, reorderThreshold: e.target.value }))} />
          </label>
          <label className="text-sm">
            <span className="mb-2 block text-muted">Supplier</span>
            <input className="input-shell" name="supplier" required value={addForm.supplier} onChange={(e) => setAddForm((f) => ({ ...f, supplier: e.target.value }))} />
          </label>
          <div className="flex gap-2 lg:col-span-2">
            <button className="button-primary" type="submit">Add item</button>
            <button type="button" onClick={() => setAddOpen(false)} className="button-secondary">Cancel</button>
          </div>
        </form>
      </Dialog>

      {/* Edit item dialog */}
      <Dialog title={editItem ? `Edit — ${editItem.name}` : ""} open={!!editItem} onClose={() => { if (isDirty && !confirm("Discard changes?")) return; setEditItem(null); }}>
        {editItem && (
          <form className="grid gap-4 lg:grid-cols-2" onSubmit={handleEdit}>
            <input type="hidden" name="id" value={editItem.id} />
            <label className="text-sm">
              <span className="mb-2 block text-muted">Item name</span>
              <input className="input-shell" name="name" required value={editForm.name} onChange={(e) => { setEditForm((f) => ({ ...f, name: e.target.value })); setIsDirty(true); }} />
            </label>
            <label className="text-sm">
              <span className="mb-2 block text-muted">Category</span>
              <select className="input-shell" name="category" value={editForm.category} onChange={(e) => { setEditForm((f) => ({ ...f, category: e.target.value })); setIsDirty(true); }}>
                {inventoryCategories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-2 block text-muted">Unit</span>
              <input className="input-shell" name="unit" required value={editForm.unit} onChange={(e) => { setEditForm((f) => ({ ...f, unit: e.target.value })); setIsDirty(true); }} />
            </label>
            <label className="text-sm">
              <span className="mb-2 block text-muted">Reorder threshold</span>
              <input className="input-shell" name="reorderThreshold" required type="number" min="0" step="0.1" value={editForm.reorderThreshold} onChange={(e) => { setEditForm((f) => ({ ...f, reorderThreshold: e.target.value })); setIsDirty(true); }} />
            </label>
            <label className="text-sm lg:col-span-2">
              <span className="mb-2 block text-muted">Supplier</span>
              <input className="input-shell" name="supplier" required value={editForm.supplier} onChange={(e) => { setEditForm((f) => ({ ...f, supplier: e.target.value })); setIsDirty(true); }} />
            </label>
            <div className="flex gap-2 lg:col-span-2">
              <button className="button-primary" type="submit">Save changes</button>
              <button type="button" onClick={() => setEditItem(null)} className="button-secondary">Cancel</button>
            </div>
          </form>
        )}
      </Dialog>

      {/* Adjust stock dialog */}
      <Dialog title={adjustItem ? `Adjust stock — ${adjustItem.name}` : ""} open={!!adjustItem} onClose={() => setAdjustItem(null)}>
        {adjustItem && (
          <form className="space-y-4" onSubmit={handleAdjust}>
            <div className="border border-[var(--border)] bg-[var(--background)] p-3 text-sm">
              <span className="text-muted">Current stock: </span>
              <span className="font-semibold">{adjustItem.onHand} {adjustItem.unit}</span>
            </div>

            <label className="block text-sm">
              <span className="mb-2 block text-muted">Type</span>
              <select className="input-shell" value={adjForm.adjustmentType} onChange={(e) => setAdjForm((f) => ({ ...f, adjustmentType: e.target.value }))}>
                {ADJUSTMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-2 block text-muted">
                Amount ({adjustItem.unit})
                {adjForm.amount && (
                  <span className="ml-2 text-xs">
                    → {(adjustItem.onHand + (ADJUSTMENT_TYPES.find((t) => t.value === adjForm.adjustmentType)?.sign ?? 1) * Math.abs(Number(adjForm.amount))).toFixed(2)} {adjustItem.unit}
                  </span>
                )}
              </span>
              <input className="input-shell" type="number" min="0" step="0.1" required value={adjForm.amount} onChange={(e) => setAdjForm((f) => ({ ...f, amount: e.target.value }))} />
            </label>

            <label className="block text-sm">
              <span className="mb-2 block text-muted">Reason</span>
              <input className="input-shell" required placeholder="e.g. Received from supplier" value={adjForm.reason} onChange={(e) => setAdjForm((f) => ({ ...f, reason: e.target.value }))} />
            </label>

            {(adjForm.adjustmentType === "used") && (
              <label className="block text-sm">
                <span className="mb-2 block text-muted">Link to batch (optional)</span>
                <select className="input-shell" value={adjForm.batchId} onChange={(e) => setAdjForm((f) => ({ ...f, batchId: e.target.value }))}>
                  <option value="">No batch</option>
                  {activeBatches.map((b) => <option key={b.id} value={b.id}>{b.beerName} — {b.batchNumber}</option>)}
                </select>
              </label>
            )}

            <div className="flex gap-2">
              <button className="button-primary" type="submit">Log adjustment</button>
              <button type="button" onClick={() => setAdjustItem(null)} className="button-secondary">Cancel</button>
            </div>
          </form>
        )}
      </Dialog>

      {/* History dialog */}
      <Dialog title={historyItem ? `History — ${historyItem.name}` : ""} open={!!historyItem} onClose={() => setHistoryItem(null)}>
        {historyItem && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border border-[var(--border)] bg-[var(--background)] p-3 text-sm">
              <span className="text-muted">Current stock</span>
              <span className="font-semibold">{historyItem.onHand} {historyItem.unit}</span>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.15em] text-muted">Adjustment history</p>
              <button type="button" onClick={() => { setHistoryItem(null); openAdjust(historyItem); }} className="text-sm text-ink underline-offset-2 hover:underline">
                + Log adjustment
              </button>
            </div>

            {historyLoading ? (
              <p className="text-sm text-muted">Loading…</p>
            ) : adjustments.length === 0 ? (
              <p className="text-sm text-muted">No adjustments logged yet.</p>
            ) : (
              <div className="space-y-0">
                {adjustments.map((adj, i) => (
                  <div key={adj.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`mt-1 h-3 w-3 shrink-0 rounded-full ${adj.adjustmentAmount > 0 ? "bg-[var(--success)]" : "bg-[var(--danger)]"}`} />
                      {i < adjustments.length - 1 && <div className="w-px flex-1 bg-[var(--border)]" />}
                    </div>
                    <div className="pb-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`pill text-xs ${typePill(adj.adjustmentType)}`}>{adj.adjustmentType}</span>
                        <span className="text-sm font-semibold">
                          {adj.adjustmentAmount > 0 ? "+" : ""}{adj.adjustmentAmount} {historyItem.unit}
                        </span>
                        <span className="text-xs text-muted">{formatDate(adj.createdAt.slice(0, 10))}</span>
                        <span className="text-xs text-muted">by {adj.createdBy}</span>
                      </div>
                      <p className="mt-1 text-sm text-muted">{adj.reason}</p>
                      {adj.batchName && <p className="mt-0.5 text-xs text-muted">Batch: {adj.batchName}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button type="button" onClick={() => setHistoryItem(null)} className="button-secondary w-full">Close</button>
          </div>
        )}
      </Dialog>
    </div>
  );
}
