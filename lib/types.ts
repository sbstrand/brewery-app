export type BatchStage =
  | "Planned"
  | "Brewing"
  | "Fermenting"
  | "Conditioning"
  | "Packaging"
  | "Completed";

export type PackageType = "Keg" | "Can";
export type TankStatus = "Available" | "In Use" | "Cleaning" | "Maintenance";
export type TankType = "Mash Tun" | "Brite Tank" | "Unitank" | "Fermenter";
export type InventoryCategory = "Malt" | "Hops" | "Yeast" | "Adjunct" | "Cans" | "Kegs" | "Labels";
export type UserRole = "Admin" | "General User";

export type Beer = {
  id: string;
  name: string;
  style: string;
  active: boolean;
  productionDays?: number;
  targetOg?: number;
  targetFg?: number;
  targetAbv?: number;
  targetIbu?: number;
  defaultPackageType?: PackageType;
  notes: string;
};

export type Batch = {
  id: string;
  batchNumber: string;
  beerId?: string;
  beerName: string;
  style: string;
  stage: BatchStage;
  plannedBrewDate: string;
  plannedEndDate?: string;
  actualBrewDate?: string;
  updatedAt?: string;
  assignedTankId?: string;
  targetVolumeBbl: number;
  actualVolumeBbl?: number;
  og?: number;
  fg?: number;
  abv?: number;
  ibu?: number;
  notes: string;
  packageType?: PackageType;
  packageDate?: string;
  packagedUnits?: number;
};

export type Tank = {
  id: string;
  name: string;
  type: TankType;
  capacityBbl: number;
  status: TankStatus;
  currentBatchId?: string;
  lastCipDate: string;
};

export type InventoryItem = {
  id: string;
  name: string;
  category: InventoryCategory;
  onHand: number;
  unit: string;
  reorderThreshold: number;
  supplier: string;
};

export type AdjustmentType = "received" | "used" | "waste" | "correction";

export type InventoryAdjustment = {
  id: string;
  inventoryItemId: string;
  batchId?: string;
  batchName?: string;
  adjustmentAmount: number;
  adjustmentType: AdjustmentType;
  reason: string;
  createdBy: string;
  createdAt: string;
};

export type Activity = {
  id: string;
  date: string;
  title: string;
  detail: string;
  batchId?: string;
};

export type BatchLog = {
  id: string;
  batchId: string;
  stage: BatchStage;
  note: string;
  createdBy: string; // user's full name
  createdAt: string;
};

export type RecipeIngredient = {
  id: string;
  recipeId: string;
  inventoryItemId: string;
  inventoryItemName: string;
  quantity: number;
  unit: string;
};

export type Recipe = {
  id: string;
  beerId: string;
  beerName: string;
  batchSizeBbl: number;
  ingredients: RecipeIngredient[];
};

export type UserStatus = "pending" | "active" | "inactive";

export type AppUser = {
  id: string;
  name: string;
  email?: string;
  role: UserRole;
  status: UserStatus;
};
