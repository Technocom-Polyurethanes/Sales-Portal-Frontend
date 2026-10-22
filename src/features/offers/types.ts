import type { PackagingLine } from "../../lib/calculations/packaging"
import type { Totals } from "../../lib/calculations/tax"

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
  packaging: PackagingLine[]
  quantityKg: number
  ratePerKg: number
  discountPercent: number
  amount: number
  showSpecifications: boolean
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
  advancePayment: number
  notes: string
  status: OfferStatus
  version: number
  totals: Totals
  documentLanguage: "en" | "ar"
  createdAt: string
}

/** Payload used when a new offer is issued. */
export type CreateOfferInput = Omit<Offer, "id" | "createdAt" | "totals" | "status" | "version">
