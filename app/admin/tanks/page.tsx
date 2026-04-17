import { createTankAction, logCip, updateTank } from "@/app/actions/data";
import { AdminGate } from "@/components/admin-gate";
import { AdminSectionNav } from "@/components/admin-section-nav";
import { TanksManager } from "@/components/tanks-manager";
import { PageHeader } from "@/components/ui";
import { getAppData } from "@/lib/data";

export default async function AdminTanksPage() {
  const { batches, tanks } = await getAppData();
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Administration" title="Manage tanks" description="" />
      <AdminGate>
        <AdminSectionNav />
        <TanksManager tanks={tanks} batches={batches} createAction={createTankAction} updateAction={updateTank} logCipAction={logCip} />
      </AdminGate>
    </div>
  );
}
