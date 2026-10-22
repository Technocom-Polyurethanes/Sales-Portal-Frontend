import type { PackageType } from "../../features/settings/types"

export const packageTypes: PackageType[] = [
  {
    id: "drum",
    name: "Drum",
    nameAr: "برميل",
    defaultWeightKg: 210,
    sizesKg: [200, 210, 220, 250],
  },
  {
    id: "pail",
    name: "Pail",
    nameAr: "علبة",
    defaultWeightKg: 25,
    sizesKg: [20, 25, 30],
  },
  {
    id: "jerrycan",
    name: "Jerrycan",
    nameAr: "جريركان",
    defaultWeightKg: 20,
    sizesKg: [20, 25],
  },
  {
    id: "ibc",
    name: "IBC Tank",
    nameAr: "خزان IBC",
    defaultWeightKg: 1000,
    sizesKg: [1000],
  },
  {
    id: "bag",
    name: "Bag",
    nameAr: "كيس",
    defaultWeightKg: 25,
    sizesKg: [25, 50],
  },
]
