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
  productId?: string
  materialId?: string
  materialName: string
  materialCode?: string
  category: string
  packaging: PackagingLine[]
  quantityKg: number
  ratePerKg: number
  discountPercent: number
  amount: number
  showSpecifications?: boolean
}

/** A material line while it is being edited in the builder. */
export type OfferDraftLine = {
  id: string
  productId?: string
  materialId?: string
  materialName: string
  materialCode?: string
  category: string
  ratePerKg: number
  discountPercent: number
  packaging: PackagingLine[]
}

export type OfferType = "Loc" | "Int"

/** The state of the offer while it is being built. */
export type OfferDraft = {
  /** Local or International offer type. */
  offerType: OfferType
  /** Sequence number of the reference. Suggested automatically, editable for a new offer. */
  sequence: number
  /** Generated from the offer type, the sequence and the user initials; never typed. */
  reference: string
  customerId: string
  /** Contact person printed in the "Attention" line, editable per offer. */
  attention: string
  /** Arabic contact person, printed on the Arabic document. Empty hides it. */
  attentionAr?: string
  /** Customer tax ID, editable per offer. */
  taxId?: string
  issueDate: string
  currency: string
  paymentTermId: string
  /** Days the offer stays valid from the issue date, 0 hides the row. */
  validityDays: number
  lines: OfferDraftLine[]
  taxPercent: number
  otherTaxEnabled: boolean
  /** Fixed at 1% while the deduction is enabled, 0 otherwise. */
  otherTaxPercent: number
  /** Bank accounts printed on the document; an empty selection is not allowed. */
  bankAccountIds: string[]
  /** Order discount percentage applied to the subtotal. */
  orderDiscountPercent: number
  delivery: DeliveryBatch[]
  notes: string
  documentLanguage: DocumentLanguage
}

/** Packages of one material scheduled in a delivery batch. */
export type DeliveryAllocation = {
  productId?: string
  materialId?: string
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
  /** Local or International offer type. */
  offerType: OfferType
  /** Contact person printed in the "Attention" line of the document. */
  attention: string
  /** Arabic contact person, printed on the Arabic document. */
  attentionAr?: string
  /** Customer tax ID. */
  taxId?: string
  issueDate: string
  dueDate: string
  currency: string
  paymentTermId: string
  /** Days the offer stays valid from the issue date. */
  validityDays?: number
  lines: OfferLine[]
  delivery: DeliveryBatch[]
  taxPercent: number
  otherTaxEnabled: boolean
  otherTaxName: string
  otherTaxPercent: number
  /** Selected bank accounts; null for offers saved before per-offer selection existed. */
  bankAccountIds?: string[] | null
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
  /** Shared by every version of the offer, it stays the same when the reference changes. */
  rootOfferId?: string
  totals: Totals
  documentLanguage: DocumentLanguage
  /** Who created the offer and when: set by the server, never typed. */
  createdByName?: string | null
  createdAt: string
  /** Who saved the offer last (a new version, a status change) and when. */
  updatedByName?: string | null
  updatedAt?: string
}

export type OfferListItem = {
  id: string
  reference: string
  serialNumber: number
  version: number
  /** Shared by every version of the offer. */
  rootOfferId?: string
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
  lastModifiedByName?: string | null
  lastModifiedAt?: string
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
