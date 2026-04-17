import { AdminGate } from "@/components/admin-gate";
import { AdminSectionNav } from "@/components/admin-section-nav";
import { ReportsPanel } from "@/components/reports-panel";
import { PageHeader } from "@/components/ui";
import { getAppData } from "@/lib/data";

export default async function AdminReportsPage() {
  const { batches, beers, tanks, inventory } = await getAppData();
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Administration" title="Reports" description="" />
      <AdminGate>
        <AdminSectionNav />
        <ReportsPanel batches={batches} beers={beers} tanks={tanks} inventory={inventory} />
      </AdminGate>
    </div>
  );
}
