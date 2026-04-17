import { upsertRecipe } from "@/app/actions/data";
import { AdminGate } from "@/components/admin-gate";
import { AdminSectionNav } from "@/components/admin-section-nav";
import { RecipesManager } from "@/components/recipes-manager";
import { PageHeader } from "@/components/ui";
import { getAppData } from "@/lib/data";

export default async function AdminRecipesPage() {
  const { beers, inventory, recipes } = await getAppData();
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Administration" title="Recipes" description="Associate ingredient lists with beers. Quantities are auto-populated when creating a new batch." />
      <AdminGate>
        <AdminSectionNav />
        <RecipesManager beers={beers} inventory={inventory} recipes={recipes} upsertAction={upsertRecipe} />
      </AdminGate>
    </div>
  );
}
