"use client";

import { useState, useTransition } from "react";
import { Dialog } from "@/components/dialog";
import { Beer, InventoryItem, Recipe } from "@/lib/types";

const RECIPE_CATEGORIES = ["Malt", "Hops", "Yeast", "Adjunct"] as const;
type RecipeCategory = typeof RECIPE_CATEGORIES[number];

type IngredientLine = { inventoryItemId: string; quantity: string };
type SectionState = Record<RecipeCategory, IngredientLine[]>;

const emptySection = (): IngredientLine[] => [{ inventoryItemId: "", quantity: "" }];

function emptyState(): SectionState {
  return { Malt: emptySection(), Hops: emptySection(), Yeast: emptySection(), Adjunct: emptySection() };
}

export function RecipesManager({
  beers,
  inventory,
  recipes,
  upsertAction
}: {
  beers: Beer[];
  inventory: InventoryItem[];
  recipes: Recipe[];
  upsertAction: (formData: FormData) => Promise<void>;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBeerId, setEditingBeerId] = useState("");
  const [batchSizeBbl, setBatchSizeBbl] = useState("");
  const [sections, setSections] = useState<SectionState>(emptyState);
  const [, startTransition] = useTransition();

  const inventoryByCategory = Object.fromEntries(
    RECIPE_CATEGORIES.map((cat) => [cat, inventory.filter((i) => i.category === cat)])
  ) as Record<RecipeCategory, InventoryItem[]>;

  function openEdit(beerId: string) {
    const existing = recipes.find((r) => r.beerId === beerId);
    if (existing?.ingredients.length) {
      const state = emptyState();
      existing.ingredients.forEach((ing) => {
        const item = inventory.find((i) => i.id === ing.inventoryItemId);
        const cat = item?.category as RecipeCategory | undefined;
        if (cat && RECIPE_CATEGORIES.includes(cat)) {
          // Replace the empty placeholder on first real ingredient
          const lines = state[cat];
          if (lines.length === 1 && !lines[0].inventoryItemId) {
            state[cat] = [{ inventoryItemId: ing.inventoryItemId, quantity: ing.quantity.toString() }];
          } else {
            state[cat] = [...lines, { inventoryItemId: ing.inventoryItemId, quantity: ing.quantity.toString() }];
          }
        }
      });
      setSections(state);
    } else {
      setSections(emptyState());
    }
    setBatchSizeBbl(existing?.batchSizeBbl?.toString() ?? "");
    setEditingBeerId(beerId);
    setDialogOpen(true);
  }

  function addLine(cat: RecipeCategory) {
    setSections((s) => ({ ...s, [cat]: [...s[cat], { inventoryItemId: "", quantity: "" }] }));
  }

  function removeLine(cat: RecipeCategory, i: number) {
    setSections((s) => {
      const next = s[cat].filter((_, idx) => idx !== i);
      return { ...s, [cat]: next.length ? next : emptySection() };
    });
  }

  function updateLine(cat: RecipeCategory, i: number, field: keyof IngredientLine, value: string) {
    setSections((s) => ({
      ...s,
      [cat]: s[cat].map((l, idx) => idx === i ? { ...l, [field]: value } : l)
    }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData();
    formData.set("beerId", editingBeerId);
    formData.set("batchSizeBbl", batchSizeBbl);
    RECIPE_CATEGORIES.forEach((cat) => {
      sections[cat].forEach((ing) => {
        if (ing.inventoryItemId && ing.quantity) {
          formData.append("ingredientItemId", ing.inventoryItemId);
          formData.append("ingredientQuantity", ing.quantity);
        }
      });
    });
    startTransition(async () => {
      await upsertAction(formData);
      setDialogOpen(false);
    });
  }

  const beersWithRecipe = new Set(recipes.map((r) => r.beerId));

  return (
    <div className="space-y-6">
      <section className="panel p-5 sm:p-6">
        <h3 className="text-xl font-semibold mb-5">Recipes</h3>
        <div className="table-shell">
          <table>
            <thead>
              <tr>
                <th>Beer</th>
                <th>Batch size</th>
                <th>Ingredients</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {beers.filter((b) => b.active).map((beer) => {
                const recipe = recipes.find((r) => r.beerId === beer.id);
                return (
                  <tr key={beer.id}>
                    <td>
                      <p className="font-semibold">{beer.name}</p>
                      <p className="text-sm text-muted">{beer.style}</p>
                    </td>
                    <td className="text-sm">{recipe?.batchSizeBbl ? `${recipe.batchSizeBbl} bbl` : "—"}</td>
                    <td>
                      {recipe?.ingredients.length ? (
                        <div className="space-y-0.5">
                          {recipe.ingredients.map((ing) => (
                            <p key={ing.id} className="text-sm">{ing.inventoryItemName} — {ing.quantity} {ing.unit}</p>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-muted">No recipe</span>
                      )}
                    </td>
                    <td>
                      <button type="button" onClick={() => openEdit(beer.id)} className="text-sm text-ink underline-offset-2 hover:underline">
                        {beersWithRecipe.has(beer.id) ? "Edit" : "Add recipe"}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {beers.filter((b) => b.active).length === 0 && (
                <tr><td colSpan={3} className="text-sm text-muted">No active beers.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog
        title={`Recipe — ${beers.find((b) => b.id === editingBeerId)?.name ?? ""}`}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <label className="text-sm block">
            <span className="mb-2 block text-muted">Recipe batch size (bbl)</span>
            <input
              className="input-shell"
              type="number"
              min="0.1"
              step="0.1"
              required
              placeholder="e.g. 10"
              value={batchSizeBbl}
              onChange={(e) => setBatchSizeBbl(e.target.value)}
            />
            <p className="mt-1 text-xs text-muted">Ingredient quantities will be scaled proportionally when creating a batch.</p>
          </label>
          {RECIPE_CATEGORIES.map((cat) => {
            const options = inventoryByCategory[cat];
            return (
              <div key={cat}>
                <p className="mb-2 text-xs uppercase tracking-[0.2em] text-muted">{cat}</p>
                <div className="space-y-2">
                  {sections[cat].map((line, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <select
                        className="input-shell min-w-0 flex-[2]"
                        style={{ width: "auto" }}
                        value={line.inventoryItemId}
                        onChange={(e) => updateLine(cat, i, "inventoryItemId", e.target.value)}
                      >
                        <option value="">— none —</option>
                        {options.map((item) => (
                          <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>
                        ))}
                      </select>
                      <input
                        className="input-shell w-24 shrink-0"
                        style={{ width: "6rem" }}
                        type="number"
                        min="0"
                        step="0.001"
                        placeholder="Qty"
                        value={line.quantity}
                        onChange={(e) => updateLine(cat, i, "quantity", e.target.value)}
                      />
                      {sections[cat].length > 1 && (
                        <button type="button" onClick={() => removeLine(cat, i)} className="text-sm text-muted hover:text-[var(--danger)]">✕</button>
                      )}
                    </div>
                  ))}
                </div>
                {options.length > 0 && (
                  <button type="button" onClick={() => addLine(cat)} className="mt-2 text-xs text-[var(--accent)] hover:underline underline-offset-2">
                    + Add {cat.toLowerCase()}
                  </button>
                )}
              </div>
            );
          })}
          <div className="flex gap-2 border-t border-[var(--border)] pt-4">
            <button className="button-primary" type="submit">Save recipe</button>
            <button type="button" onClick={() => setDialogOpen(false)} className="button-secondary">Cancel</button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
