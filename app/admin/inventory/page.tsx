import { createInventoryItem, logInventoryAdjustment, updateInventoryItem } from "@/app/actions/data";
import { AdminGate } from "@/components/admin-gate";
import { AdminSectionNav } from "@/components/admin-section-nav";
import { InventoryManager } from "@/components/inventory-manager";
import { PageHeader } from "@/components/ui";
import { getAppData } from "@/lib/data";

export default async function AdminInventoryPage() {
  const { inventory, batches } = await getAppData();
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Administration" title="Manage inventory" description="" />
      <AdminGate>
        <AdminSectionNav />
        <InventoryManager
          inventory={inventory}
          batches={batches}
          createAction={createInventoryItem}
          updateAction={updateInventoryItem}
          adjustAction={logInventoryAdjustment}
        />
      </AdminGate>
    </div>
  );
}
