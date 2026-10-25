export type Product = {
  id: string
  code: string
  itemCode?: string
  erpNextItemCode?: string
  name: string
  category: string
  defaultPackageTypeId: string
  defaultWeightKg: number
  referencePrice: number
  specifications?: string
}
