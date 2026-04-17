import { createBatch, deleteBatch, saveBatchIngredientVariance, updateBatch } from "@/app/actions/data";
import { BatchesManager } from "@/components/batches-manager";
import { PageHeader } from "@/components/ui";
import { getAppData } from "@/lib/data";

export default async function BatchesPage() {
  const { batches, beers, tanks, inventory, recipes } = await getAppData();
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Production" title="Production runs" description="" />
      <BatchesManager batches={batches} tanks={tanks} beers={beers} inventory={inventory} recipes={recipes} createAction={createBatch} updateAction={updateBatch} deleteAction={deleteBatch} varianceAction={saveBatchIngredientVariance} />
    </div>
  );
}
