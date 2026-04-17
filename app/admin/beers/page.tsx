import { createBeer, toggleBeerActive, updateBeer } from "@/app/actions/data";
import { AdminGate } from "@/components/admin-gate";
import { AdminSectionNav } from "@/components/admin-section-nav";
import { BeersManager } from "@/components/beers-manager";
import { PageHeader } from "@/components/ui";
import { getAppData } from "@/lib/data";

export default async function AdminBeersPage() {
  const { beers } = await getAppData();
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Administration" title="Beer catalog" description="Define the beers your brewery produces. General users select from this list when creating a production run." />
      <AdminGate>
        <AdminSectionNav />
        <BeersManager beers={beers} createAction={createBeer} updateAction={updateBeer} toggleActiveAction={toggleBeerActive} />
      </AdminGate>
    </div>
  );
}
