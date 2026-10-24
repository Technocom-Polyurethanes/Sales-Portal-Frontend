import { dueDateFrom } from "../../lib/calculations/dueDate"
import {
  totalQuantityKg,
  type PackagingLine,
} from "../../lib/calculations/packaging"
import { referenceNumber } from "../../lib/calculations/reference"
import { calculateTotals } from "../../lib/calculations/tax"
import type {
  DeliveryAllocation,
  DeliveryBatch,
  Offer,
  OfferLine,
  OfferStatus,
} from "../../features/offers/types"
import { customers } from "./customers"
import { products } from "./products"

export type PackagingSpec = {
  typeId: string
  typeName: string
  weightKg: number
  packages: number
}

export type LineSpec = {
  productId: string
  ratePerKg: number
  packaging: PackagingSpec[]
}

export type DeliverySpec = {
  date: string
  allocations: DeliveryAllocation[]
}

export type OfferSpec = {
  sequence: number
  customerIndex: number
  issueDate: string
  status: OfferStatus
  version: number
  lines: LineSpec[]
  taxPercent?: number
  otherTaxEnabled?: boolean
  otherTaxPercent?: number
  advancePayment?: number
  notes?: string
  delivery?: DeliverySpec[]
  documentLanguage?: "en" | "ar"
}

/** Shorthand for a packaging row inside a mock offer. */
export const packaging = (
  typeId: string,
  typeName: string,
  weightKg: number,
  packages: number,
): PackagingSpec => ({
  typeId,
  typeName,
  weightKg,
  packages,
})

function buildLines(specs: LineSpec[]): OfferLine[] {
  return specs.map((spec, index) => {
    const product = products.find((item) => item.id === spec.productId)
    const rows: PackagingLine[] = spec.packaging.map((row, rowIndex) => ({
      id: `line-${index + 1}-pack-${rowIndex + 1}`,
      packageTypeId: row.typeId,
      packageTypeName: row.typeName,
      weightPerPackageKg: row.weightKg,
      packages: row.packages,
    }))
    const quantityKg = totalQuantityKg(rows)

    return {
      id: `line-${index + 1}`,
      productId: spec.productId,
      materialName: product?.name ?? "Material",
      materialCode: product?.code ?? "—",
      category: product?.category ?? "Material",
      packaging: rows,
      quantityKg,
      ratePerKg: spec.ratePerKg,
      discountPercent: 0,
      amount: Math.round(quantityKg * spec.ratePerKg * 100) / 100,
      showSpecifications: false,
    }
  })
}

function buildDelivery(
  issueDate: string,
  batches: DeliverySpec[] | undefined,
): DeliveryBatch[] {
  return (batches ?? []).map((batch, index) => ({
    id: `batch-${index + 1}`,
    batchNumber: index + 1,
    date: batch.date,
    allocations: batch.allocations,
  }))
}

/** Builds a complete offer (including its totals) from a compact spec. */
export function buildOffer(spec: OfferSpec): Offer {
  const customer = customers[spec.customerIndex]
  const lines = buildLines(spec.lines)
  const subtotal = lines.reduce((sum, line) => sum + line.amount, 0)

  const totals = calculateTotals({
    subtotal,
    taxPercent: spec.taxPercent ?? 14,
    otherTaxEnabled: spec.otherTaxEnabled ?? false,
    otherTaxPercent: spec.otherTaxPercent ?? 0,
    advancePayment: spec.advancePayment ?? 0,
  })

  return {
    id: `offer-${spec.sequence}`,
    reference: referenceNumber(spec.sequence, spec.issueDate),
    customerId: customer.id,
    customerName: customer.name,
    issueDate: spec.issueDate,
    dueDate: dueDateFrom(spec.issueDate, customer.paymentTermId),
    currency: "EGP",
    paymentTermId: customer.paymentTermId,
    lines,
    delivery: buildDelivery(spec.issueDate, spec.delivery),
    taxPercent: spec.taxPercent ?? 14,
    otherTaxEnabled: spec.otherTaxEnabled ?? false,
    otherTaxName: "Other tax",
    otherTaxPercent: spec.otherTaxPercent ?? 0,
    orderDiscount: 0,
    extraExpenses: 0,
    advancePayment: spec.advancePayment ?? 0,
    notes: spec.notes ?? "",
    status: spec.status,
    version: spec.version,
    attention: customer.contactPerson ?? "",
    totals,
    documentLanguage: spec.documentLanguage ?? "en",
    createdAt: spec.issueDate,
  }
}
