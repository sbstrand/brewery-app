import { createBatch, deleteBatch, logInventoryAdjustment, reassignBatchTank, removeBatchTank, saveBatchIngredientVariance, updateBatch } from "@/app/actions/data";
import { Dashboard } from "@/components/dashboard";
import { getAppData } from "@/lib/data";

export default async function DashboardPage() {
  const { batches, beers, tanks, inventory, recentActivity, recipes } = await getAppData();
  return (
    <Dashboard
      batches={batches}
      beers={beers}
      tanks={tanks}
      inventory={inventory}
      recentActivity={recentActivity}
      recipes={recipes}
      updateAction={updateBatch}
      createAction={createBatch}
      deleteAction={deleteBatch}
      reassignAction={reassignBatchTank}
      adjustAction={logInventoryAdjustment}
      varianceAction={saveBatchIngredientVariance}
      removeTankAction={removeBatchTank}
    />
  );
}
