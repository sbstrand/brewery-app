import { createBatch, deleteBatch, updateBatch } from "@/app/actions/data";
import { BatchesManager } from "@/components/batches-manager";
import { PageHeader } from "@/components/ui";
import { getAppData } from "@/lib/data";

export default async function BatchesPage() {
  const { batches, beers, tanks } = await getAppData();
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Production" title="Production runs" description="" />
      <BatchesManager batches={batches} tanks={tanks} beers={beers} createAction={createBatch} updateAction={updateBatch} deleteAction={deleteBatch} />
    </div>
  );
}
