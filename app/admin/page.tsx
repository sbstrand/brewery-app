import { AdminGate } from "@/components/admin-gate";
import { AdminSectionNav } from "@/components/admin-section-nav";
import { PageHeader } from "@/components/ui";

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Administration" title="Admin controls" description="" />
      <AdminGate>
        <AdminSectionNav />
      </AdminGate>
    </div>
  );
}
