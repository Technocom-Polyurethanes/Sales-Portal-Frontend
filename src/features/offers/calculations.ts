import { dueDateFrom } from "../../lib/calculations/dueDate"
import {
  packagingBreakdown,
  totalPackages,
  totalQuantityKg,
  type PackagingBreakdown,
} from "../../lib/calculations/packaging"
import { roundMoney } from "../../lib/calculations/round"
import {
  OTHER_TAX_PERCENT,
  calculateTotals,
  type Totals,
} from "../../lib/calculations/tax"
import type { OfferDraft, OfferDraftLine } from "./types"

/** The computed numbers of one material line. */
export type DraftLineCalculation = {
  id: string
  quantityKg: number
  packages: number
  amount: number
  breakdown: PackagingBreakdown[]
}

/** Everything the builder derives from the current draft. */
export type DraftCalculations = {
  lines: DraftLineCalculation[]
  subtotal: number
  totals: Totals
  reference: string
  dueDate: string
  /** Packages already scheduled per product. */
  scheduled: Record<string, number>
  /** Packages still waiting for a delivery date. */
  remaining: Record<string, number>
  /** Packages ordered per product, across every line of that material. */
  ordered: Record<string, number>
  /** Average weight of one package per product, used by the delivery weights. */
  weightPerPackage: Record<string, number>
}

/** Packages of one material across every line that uses it. */
export function orderedPackages(
  lines: OfferDraftLine[],
  productId: string,
): number {
  return lines.reduce(
    (sum, line) =>
      line.productId === productId ? sum + totalPackages(line.packaging) : sum,
    0,
  )
}

/** Amount of one material line, discount included. */
export function draftLineAmount(line: OfferDraftLine): number {
  const quantity = totalQuantityKg(line.packaging)
  const rate = Number.isFinite(line.ratePerKg) ? line.ratePerKg : 0
  const discount = Math.min(
    100,
    Math.max(
      0,
      Number.isFinite(line.discountPercent) ? line.discountPercent : 0,
    ),
  )
  return roundMoney(quantity * rate * (1 - discount / 100))
}

/** Computes every number shown next to the builder fields. */
export function calculateDraft(draft: OfferDraft): DraftCalculations {
  const lines = draft.lines.map((line) => ({
    id: line.id,
    quantityKg: totalQuantityKg(line.packaging),
    packages: totalPackages(line.packaging),
    amount: draftLineAmount(line),
    breakdown: packagingBreakdown(line.packaging),
  }))

  const subtotal = roundMoney(lines.reduce((sum, line) => sum + line.amount, 0))

  const totals = calculateTotals({
    subtotal,
    taxPercent: draft.taxPercent,
    otherTaxEnabled: draft.otherTaxEnabled,
    otherTaxPercent: draft.otherTaxEnabled ? OTHER_TAX_PERCENT : 0,
    orderDiscount: draft.orderDiscount,
  })

  const scheduled: Record<string, number> = {}
  for (const batch of draft.delivery) {
    for (const allocation of batch.allocations) {
      scheduled[allocation.productId] =
        (scheduled[allocation.productId] ?? 0) + allocation.packages
    }
  }

  const ordered: Record<string, number> = {}
  const quantity: Record<string, number> = {}
  for (const line of draft.lines) {
    ordered[line.productId] =
      (ordered[line.productId] ?? 0) + totalPackages(line.packaging)
    quantity[line.productId] =
      (quantity[line.productId] ?? 0) + totalQuantityKg(line.packaging)
  }

  const weightPerPackage: Record<string, number> = {}
  for (const productId of Object.keys(ordered)) {
    weightPerPackage[productId] =
      ordered[productId] > 0
        ? roundMoney(quantity[productId] / ordered[productId])
        : 0
  }

  const remaining: Record<string, number> = {}
  for (const productId of Object.keys(ordered)) {
    remaining[productId] = Math.max(
      0,
      ordered[productId] - (scheduled[productId] ?? 0),
    )
  }

  return {
    lines,
    subtotal,
    totals,
    reference: draft.reference,
    dueDate: dueDateFrom(draft.issueDate, draft.paymentTermId),
    scheduled,
    remaining,
    ordered,
    weightPerPackage,
  }
}
