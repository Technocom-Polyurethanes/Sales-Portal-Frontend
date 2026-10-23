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
  issueDate: string
  currency: string
  paymentTermId: string
  lines: OfferDraftLine[]
  taxPercent: number
  otherTaxEnabled: boolean
  /** Fixed at 1% while the deduction is enabled, 0 otherwise. */
  otherTaxPercent: number
  orderDiscount: number
  delivery: DeliveryBatch[]
  notes: string
  documentLanguage: DocumentLanguage
}

/** Packages of one material scheduled in a delivery batch. */
export type DeliveryAllocation = {
  productId: string
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

/** Payload used when a new offer is issued. */
export type CreateOfferInput = Omit<Offer, "id" | "createdAt" | "totals" | "status" | "version">
