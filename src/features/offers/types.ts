import type { PackagingLine } from "../../lib/calculations/packaging"
import type { Totals } from "../../lib/calculations/tax"
import type { DocumentLanguage } from "../../pdf/PdfLanguageProvider"

export type OfferStatus = "draft" | "issued" | "accepted" | "rejected"

export const OFFER_STATUSES: OfferStatus[] = [
  "draft",
  "issued",
  "accepted",
  "rejected",
]

/** One priced material line of an offer. */
export type OfferLine = {
  id: string
  productId: string
  materialName: string
  materialCode: string
  category: string
  packaging: PackagingLine[]
  quantityKg: number
  ratePerKg: number
  discountPercent: number
  amount: number
  showSpecifications: boolean
}

/** A material line while it is being edited in the builder. */
export type OfferDraftLine = {
  id: string
  productId: string
  materialName: string
  materialCode: string
  category: string
  ratePerKg: number
  discountPercent: number
  packaging: PackagingLine[]
}

/** The state of the offer while it is being built. */
export type OfferDraft = {
  /** Typed by the user, printed verbatim on the document. */
  reference: string
  customerId: string
  /** Contact person printed in the "Attention" line, editable per offer. */
  attention: string
  /** Customer tax ID, editable per offer. */
  taxId?: string
  issueDate: string
  currency: string
  paymentTermId: string
  lines: OfferDraftLine[]
  taxPercent: number
  otherTaxEnabled: boolean
  /** Fixed at 1% while the deduction is enabled, 0 otherwise. */
  otherTaxPercent: number
  /** Order discount percentage applied to the subtotal. */
  orderDiscountPercent: number
  delivery: DeliveryBatch[]
  notes: string
  documentLanguage: DocumentLanguage
}

/** Packages of one material scheduled in a delivery batch. */
export type DeliveryAllocation = {
  productId: string
  packagingRowId?: string
  packageTypeId?: string
  packageTypeName?: string
  weightPerPackageKg?: number
  packages: number
}

/** A delivery batch with the packages allocated per material. */
export type DeliveryBatch = {
  id: string
  batchNumber: number
  date: string
  allocations: DeliveryAllocation[]
}

export type Offer = {
  id: string
  reference: string
  customerId: string
  customerName: string
  /** Contact person printed in the "Attention" line of the document. */
  attention: string
  /** Customer tax ID. */
  taxId?: string
  issueDate: string
  dueDate: string
  currency: string
  paymentTermId: string
  lines: OfferLine[]
  delivery: DeliveryBatch[]
  taxPercent: number
  otherTaxEnabled: boolean
  otherTaxName: string
  otherTaxPercent: number
  orderDiscount: number
  /** Order discount percentage applied to the subtotal. */
  orderDiscountPercent: number
  extraExpenses: number
  advancePayment: number
  notes: string
  status: OfferStatus
  version: number
  /** Set when the offer is a new version of an earlier offer. */
  parentOfferId?: string
  totals: Totals
  documentLanguage: DocumentLanguage
  createdAt: string
}

export type OfferListItem = {
  id: string
  reference: string
  serialNumber: number
  version: number
  customerId: string
  customerName: string
  customerNameAr: string | null
  issueDate: string
  dueDate: string
  currency: string
  status: OfferStatus // lowercased by the mapper below
  total: number
  createdByName: string | null
  createdAt: string
  updatedAt: string
}

export type OfferListPage = {
  items: OfferListItem[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export type OfferListParams = {
  status?: OfferStatus | "all"
  search?: string
  page?: number
  pageSize?: number
}

/** Payload used when a new offer is issued. */
export type CreateOfferInput = Omit<Offer, "id" | "createdAt" | "totals" | "status" | "version">
