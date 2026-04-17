import { BatchStage, InventoryCategory, PackageType, TankStatus, TankType } from "@/lib/types";

export const batchStages: BatchStage[] = [
  "Planned",
  "Brewing",
  "Fermenting",
  "Conditioning",
  "Packaging",
  "Completed"
];

export const packageTypes: PackageType[] = ["Keg", "Can"];

export const tankStatuses: TankStatus[] = ["Available", "In Use", "Cleaning", "Maintenance"];

export const tankTypes: TankType[] = ["Mash Tun", "Brite Tank", "Unitank", "Fermenter"];

export const inventoryCategories: InventoryCategory[] = [
  "Malt",
  "Hops",
  "Yeast",
  "Adjunct",
  "Cans",
  "Kegs",
  "Labels"
];
