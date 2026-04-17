import { adminCreateUser, updateUserRole, updateUserStatus } from "@/app/actions/data";
import { AdminGate } from "@/components/admin-gate";
import { AdminSectionNav } from "@/components/admin-section-nav";
import { UsersManager } from "@/components/users-manager";
import { PageHeader } from "@/components/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AppUser } from "@/lib/types";

async function getUsers(): Promise<AppUser[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("app_users").select("id, full_name, email, role, status").order("full_name");
  return (data ?? []).map((r) => ({ id: r.id, name: r.full_name, email: r.email, role: r.role, status: r.status ?? "active" }));
}

export default async function AdminUsersPage() {
  const users = await getUsers();
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Administration" title="Manage users" description="" />
      <AdminGate>
        <AdminSectionNav />
        <UsersManager users={users} createAction={adminCreateUser} updateRoleAction={updateUserRole} updateStatusAction={updateUserStatus} />
      </AdminGate>
    </div>
  );
}
