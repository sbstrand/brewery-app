"use client";

import { useState, useTransition } from "react";
import { Dialog } from "@/components/dialog";
import { Batch, InventoryItem } from "@/lib/types";
import { inventoryHealth } from "@/lib/utils";

const PREVIEW_LIMIT = 4;

const ADJUSTMENT_TYPES = [
  { value: "received", label: "Received", sign: 1 as const },
  { value: "used", label: "Used in production", sign: -1 as const },
  { value: "waste", label: "Waste / loss", sign: -1 as const },
  { value: "correction", label: "Correction", sign: 1 as const }
];

function AdjustForm({
  item,
  batches,
  adjustAction,
  onDone
}: {
  item: InventoryItem;
  batches: Batch[];
  adjustAction: (formData: FormData) => Promise<void>;
  onDone: () => void;
}) {
  const [form, setForm] = useState({ adjustmentType: "received", amount: "", reason: "", batchId: "" });
  const [, startTransition] = useTransition();

  const type = ADJUSTMENT_TYPES.find((t) => t.value === form.adjustmentType)!;
  const preview = form.amount
    ? (item.onHand + type.sign * Math.abs(Number(form.amount))).toFixed(2)
    : null;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("itemId", item.id);
    fd.set("amount", (type.sign * Math.abs(Number(form.amount))).toString());
    fd.set("adjustmentType", form.adjustmentType);
    fd.set("reason", form.reason);
    if (form.batchId) fd.set("batchId", form.batchId);
    startTransition(async () => {
      await adjustAction(fd);
      onDone();
    });
  }

  const activeBatches = batches.filter((b) => b.stage !== "Completed");

  return (
    <form className="space-y-3 border-t border-[var(--border)] pt-3 mt-3" onSubmit={handleSubmit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-muted">Type</span>
          <select className="input-shell" value={form.adjustmentType} onChange={(e) => setForm((f) => ({ ...f, adjustmentType: e.target.value }))}>
            {ADJUSTMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted">
            Amount ({item.unit}){preview && <span className="ml-1 text-xs">→ {preview}</span>}
          </span>
          <input className="input-shell" type="number" min="0" step="0.1" required value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
        </label>
        <label className="text-sm sm:col-span-2">
          <span className="mb-1 block text-muted">Reason</span>
          <input className="input-shell" required placeholder="e.g. Received from supplier" value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} />
        </label>
        {form.adjustmentType === "used" && (
          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block text-muted">Link to batch (optional)</span>
            <select className="input-shell" value={form.batchId} onChange={(e) => setForm((f) => ({ ...f, batchId: e.target.value }))}>
              <option value="">No batch</option>
              {activeBatches.map((b) => <option key={b.id} value={b.id}>{b.beerName} — {b.batchNumber}</option>)}
            </select>
          </label>
        )}
      </div>
      <div className="flex gap-2">
        <button className="button-primary text-sm" type="submit">Log adjustment</button>
        <button type="button" onClick={onDone} className="button-secondary text-sm">Cancel</button>
      </div>
    </form>
  );
}

function ItemRow({
  item,
  batches,
  adjustAction
}: {
  item: InventoryItem;
  batches: Batch[];
  adjustAction: (formData: FormData) => Promise<void>;
}) {
  const [adjusting, setAdjusting] = useState(false);

  return (
    <div className="ops-item">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold">{item.name}</p>
          <p className="text-sm text-muted">{item.category}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="pill pill-warning text-xs">Reorder soon</span>
          {!adjusting && (
            <button type="button" onClick={() => setAdjusting(true)} className="button-secondary text-xs py-1 px-3">
              Adjust
            </button>
          )}
        </div>
      </div>
      <p className="mt-2 text-sm text-muted">
        {item.onHand} {item.unit} on hand • threshold {item.reorderThreshold} {item.unit}
      </p>
      {adjusting && (
        <AdjustForm item={item} batches={batches} adjustAction={adjustAction} onDone={() => setAdjusting(false)} />
      )}
    </div>
  );
}

export function InventoryAttention({
  inventory,
  batches,
  adjustAction
}: {
  inventory: InventoryItem[];
  batches: Batch[];
  adjustAction: (formData: FormData) => Promise<void>;
}) {
  const [expandOpen, setExpandOpen] = useState(false);
  const lowStock = inventory.filter((item) => inventoryHealth(item) === "low");
  const preview = lowStock.slice(0, PREVIEW_LIMIT);
  const extra = lowStock.length - PREVIEW_LIMIT;

  if (lowStock.length === 0) {
    return <p className="py-2 text-sm text-muted">All tracked inventory is above threshold.</p>;
  }

  return (
    <>
      <div className="ops-divider">
        {preview.map((item) => (
          <ItemRow key={item.id} item={item} batches={batches} adjustAction={adjustAction} />
        ))}
      </div>

      {extra > 0 && (
        <button type="button" onClick={() => setExpandOpen(true)} className="mt-3 text-xs text-muted underline-offset-2 hover:underline">
          +{extra} more
        </button>
      )}

      <Dialog title="Inventory attention" open={expandOpen} onClose={() => setExpandOpen(false)}>
        <div className="ops-divider">
          {lowStock.map((item) => (
            <ItemRow key={item.id} item={item} batches={batches} adjustAction={adjustAction} />
          ))}
        </div>
      </Dialog>
    </>
  );
}
