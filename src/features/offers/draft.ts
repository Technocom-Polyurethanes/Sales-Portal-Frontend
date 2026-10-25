import { todayIso } from "../../lib/calculations/date"
import type { PackagingLine } from "../../lib/calculations/packaging"
import { OTHER_TAX_PERCENT } from "../../lib/calculations/tax"
import type { Customer } from "../customers/types"
import type { Product } from "../products/types"
import type { PackageType } from "../settings/types"
import { calculateDraft, type DraftCalculations } from "./calculations"
import type { DeliveryBatch, Offer, OfferDraft, OfferDraftLine, OfferLine } from "./types"

let counter = 0

/** Short unique id used while the offer is still being built. */
export function draftId(prefix: string): string {
  counter += 1
  return `${prefix}-${Date.now().toString(36)}-${counter}`
}

/** A packaging row for one package type and weight. */
export function createPackagingRow(
  packageType: PackageType,
  weightKg: number = packageType.defaultWeightKg,
): PackagingLine {
  return {
    id: draftId("pack"),
    packageTypeId: packageType.id,
    packageTypeName: packageType.name,
    weightPerPackageKg: weightKg,
    packages: 0,
  }
}

/** A material line built from a product of the catalogue. */
export function createDraftLine(
  product: Product,
  packageTypes: PackageType[],
): OfferDraftLine {
  const packageType =
    packageTypes.find((type) => type.id === product.defaultPackageTypeId) ??
    packageTypes[0]

  return {
    id: draftId("line"),
    productId: product.id,
    materialName: product.name,
    materialCode: product.code,
    category: product.category,
    ratePerKg: product.referencePrice,
    discountPercent: 0,
    packaging: packageType ? [createPackagingRow(packageType, product.defaultWeightKg)] : [],
  }
}

/** An empty builder draft. */
export function createEmptyDraft(
  overrides: Partial<OfferDraft> = {},
): OfferDraft {
  return {
    reference: "",
    customerId: "",
    attention: "",
    taxId: "",
    issueDate: todayIso(),
    currency: "EGP",
    paymentTermId: "bank-transfer-purchase-order",
    lines: [],
    taxPercent: 14,
    otherTaxEnabled: false,
    otherTaxPercent: 0,
    orderDiscountPercent: 0,
    delivery: [],
    notes: "",
    documentLanguage: "en",
    ...overrides,
  }
}

/** Options used when an offer is created from a draft. */
export type DraftToOfferOptions = {
  status: Offer["status"]
  version: number
  parentOfferId?: string
}

/** Builds the offer payload sent to the API. */
export function draftToOffer(
  draft: OfferDraft,
  calculations: DraftCalculations,
  customer: Customer | undefined,
  options: DraftToOfferOptions,
): Offer {
  const lines: OfferLine[] = draft.lines.map((line, index) => ({
    id: line.id,
    productId: line.productId,
    materialName: line.materialName,
    materialCode: line.materialCode,
    category: line.category,
    packaging: line.packaging,
    quantityKg: calculations.lines[index]?.quantityKg ?? 0,
    ratePerKg: line.ratePerKg,
    discountPercent: line.discountPercent,
    amount: calculations.lines[index]?.amount ?? 0,
    showSpecifications: false,
  }))

  return {
    id: "",
    reference: calculations.reference,
    customerId: draft.customerId,
    customerName: customer?.name ?? "",
    attention: draft.attention.trim(),
    taxId: draft.taxId ?? customer?.taxId ?? "",
    issueDate: draft.issueDate,
    dueDate: calculations.dueDate,
    currency: draft.currency,
    paymentTermId: draft.paymentTermId,
    lines,
    delivery: draft.delivery,
    taxPercent: draft.taxPercent,
    otherTaxEnabled: draft.otherTaxEnabled,
    otherTaxName: "",
    otherTaxPercent: draft.otherTaxPercent,
    orderDiscount: calculations.totals.orderDiscount,
    orderDiscountPercent: draft.orderDiscountPercent,
    extraExpenses: 0,
    advancePayment: 0,
    notes: draft.notes,
    status: options.status,
    version: options.version,
    parentOfferId: options.parentOfferId,
    totals: calculations.totals,
    documentLanguage: draft.documentLanguage,
    createdAt: new Date().toISOString(),
  }
}

/** Recalculates a draft, kept short for the builder. */
export function recalculate(draft: OfferDraft): DraftCalculations {
  return calculateDraft(draft)
}



const roundMoney = (value: number) => Math.round(value * 100) / 100

/** Keeps delivery allocations consistent with the current packaging rows. */
export function reconcileDelivery(
  lines: OfferDraftLine[],
  delivery: DeliveryBatch[],
): DeliveryBatch[] {
  const rows = new Map<string, { productId: string; row: PackagingLine }>()
  for (const line of lines) {
    for (const row of line.packaging) {
      rows.set(row.id, { productId: line.productId, row })
    }
  }

  const used = new Map<string, number>()

  return delivery.map((batch) => ({
    ...batch,
    allocations: batch.allocations.flatMap((allocation) => {
      if (!allocation.packagingRowId) {
        // legacy allocation: keep while the material exists
        return lines.some((l) => l.productId === allocation.productId) ? [allocation] : []
      }
      const hit = rows.get(allocation.packagingRowId)
      if (!hit) return []
      const left = hit.row.packages - (used.get(hit.row.id) ?? 0)
      const packages = Math.max(0, Math.min(allocation.packages, left))
      if (packages === 0) return []
      used.set(hit.row.id, (used.get(hit.row.id) ?? 0) + packages)
      return [
        {
          ...allocation,
          productId: hit.productId,
          packageTypeId: hit.row.packageTypeId,
          packageTypeName: hit.row.packageTypeName,
          weightPerPackageKg: hit.row.weightPerPackageKg,
          packages,
        },
      ]
    }),
  }))
}

/** Turns a stored offer back into an editable draft. */
export function offerToDraft(offer: Offer): OfferDraft {
  const rowIds = new Map<string, string>()

  const lines = offer.lines.map((line) => ({
    id: draftId("line"),
    productId: line.productId,
    materialName: line.materialName,
    materialCode: line.materialCode,
    category: line.category,
    ratePerKg: line.ratePerKg,
    discountPercent: line.discountPercent,
    packaging: line.packaging.map((row) => {
      const id = draftId("pack")
      rowIds.set(row.id, id)
      return { ...row, id }
    }),
  }))

  return {
    reference: offer.reference,
    customerId: offer.customerId,
    attention: offer.attention ?? "",
    taxId: offer.taxId ?? "",
    issueDate: offer.issueDate,
    currency: offer.currency,
    paymentTermId: offer.paymentTermId,
    lines,
    taxPercent: offer.taxPercent,
    otherTaxEnabled: offer.otherTaxEnabled,
    otherTaxPercent: offer.otherTaxEnabled ? OTHER_TAX_PERCENT : 0,
    orderDiscountPercent: offer.orderDiscountPercent ?? 0,
    delivery: offer.delivery.map((batch) => ({
      ...batch,
      id: draftId("batch"),
      allocations: batch.allocations.map((allocation) => ({
        ...allocation,
        packagingRowId: allocation.packagingRowId
          ? rowIds.get(allocation.packagingRowId) ?? allocation.packagingRowId
          : allocation.packagingRowId,
      })),
    })),
    notes: offer.notes,
    documentLanguage: offer.documentLanguage,
  }
}
