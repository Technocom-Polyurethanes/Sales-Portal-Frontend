export type Product = {
  id: string
  code: string
  itemCode?: string
  erpNextItemCode?: string
  name: string
  category: string
  defaultPackageTypeId: string
  defaultPackageTypeName?: string
  defaultWeightKg: number
  referencePrice: number
  uom?: string
  isActive?: boolean
  specifications?: string
}
