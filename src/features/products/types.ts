export type Product = {
  id: string
  code: string
  name: string
  category: string
  defaultPackageTypeId: string
  defaultWeightKg: number
  availableSizesKg: number[]
  referencePrice: number
  specifications?: string
}
