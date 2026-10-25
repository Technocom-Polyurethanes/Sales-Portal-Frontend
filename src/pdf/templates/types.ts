/** Text of the printed offer. The layout is identical in both languages. */
export type OfferTemplate = {
  language: "en" | "ar"
  title: string
  billTo: string
  attention: string
  taxId: string
  reference: string
  date: string
  terms: string
  dueDate: string
  item: string
  quantity: string
  rate: string
  amount: string
  packaging: string
  subtotal: string
  discount: string
  tax: string
  otherTax: string
  total: string
  schedule: string
  batch: string
  deliveryDate: string
  packages: string
  totalWeight: string
  bankDetails: string
  bank: string
  branch: string
  accountNumber: string
  swift: string
  iban: string
  currency: string
  notes: string
  page: string
}

/** Everything the document needs, already calculated by the feature layer. */
export type OfferDocumentLine = {
  productId?: string
  name: string
  code: string
  category: string
  packagingSummary: string
  quantityKg: number
  ratePerKg: number
  amount: number
}

export type OfferDocumentAllocation = {
  label: string
  productId?: string
  materialName?: string
  packages: number
  weightKg: number
  packageTypeName?: string
}

export type OfferDocumentBatch = {
  batchNumber: number
  date: string
  weekday: string
  allocations: OfferDocumentAllocation[]
  totalPackages: number
  totalWeightKg: number
}

export type OfferDocumentData = {
  companyName: string
  companyNameAr: string
  tagline: string
  taglineAr: string
  formCode: string
  customerName: string
  customerAddress: string
  attention: string
  taxId?: string
  reference: string
  issueDate: string
  dueDate: string
  paymentTerm: string
  currency: string
  lines: OfferDocumentLine[]
  subtotal: number
  /** Order discount percentage applied to the subtotal. */
  orderDiscountPercent: number
  orderDiscount: number
  taxPercent: number
  taxAmount: number
  otherTaxEnabled: boolean
  otherTaxPercent: number
  otherTaxAmount: number
  total: number
  delivery: OfferDocumentBatch[]
  banks: {
    bank: string
    branch: string
    accountNumber: string
    swift: string
    iban: string
    currency: string
  }[]
  notes: string
}
