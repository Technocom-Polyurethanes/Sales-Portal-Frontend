import { todayIso } from "../../lib/calculations/date"
import type { PackagingLine } from "../../lib/calculations/packaging"
import { OTHER_TAX_PERCENT } from "../../lib/calculations/tax"
import { DEFAULT_VALIDITY_DAYS, normalizeValidityDays } from "../../lib/calculations/validity"
import type { Product } from "../products/types"
import type { Customer } from "../customers/types"
import type { BankAccount, PackageType } from "../settings/types"
import { referenceSequence } from "../../lib/calculations/reference"
import { defaultBankIds } from "./bankSelection"
import { calculateDraft, type DraftCalculations } from "./calculations"
import type { DeliveryBatch, Offer, OfferDraft, OfferDraftLine, OfferType } from "./types"

/** Unique id used while the offer is built. A real GUID, because the API binds these ids as GUIDs and links delivery allocations to rows by them. */
export function draftId(_kind: string): string {
  return crypto.randomUUID()
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
  banks: BankAccount[] = [],
): OfferDraft {
  return {
    offerType: "Loc",
    sequence: 0,
    reference: "",
    customerId: "",
    attention: "",
    attentionAr: "",
    taxId: "",
    issueDate: todayIso(),
    currency: "EGP",
    paymentTermId: "bank-transfer-purchase-order",
    validityDays: DEFAULT_VALIDITY_DAYS,
    lines: [],
    taxPercent: 14,
    otherTaxEnabled: false,
    otherTaxPercent: 0,
    bankAccountIds: defaultBankIds(banks),
    orderDiscountPercent: 0,
    deliveryMode: "batches",
    delivery: [],
    deliveryText: "",
    deliveryPlace: "",
    paymentTermsText: "",
    notes: "",
    documentLanguage: "en",
    ...overrides,
  } as OfferDraft
}

/**
 * Builds the request body of POST /api/offers (OfferDraftDto).
 * No status is sent: the API always creates a draft and the status is changed
 * afterwards with PATCH /api/offers/{id}/status.
 */
export function draftToPayload(
  draft: OfferDraft,
  options: { version: number; parentOfferId?: string },
) {
  return {
    reference: draft.reference.trim(),
    version: options.version,
    parentOfferId: options.parentOfferId,
    offerType: draft.offerType,
    // The server builds the reference; the sequence is only sent so a new offer can start from a chosen number.
    serialNumber: draft.sequence > 0 ? draft.sequence : undefined,
    // Empty GUIDs are omitted: "" fails model binding (400), a missing one gets a validation message.
    customerId: draft.customerId || undefined,
    attention: draft.attention.trim(),
    attentionAr: (draft.attentionAr ?? "").trim(),
    validityDays: normalizeValidityDays(draft.validityDays),
    taxId: draft.taxId ?? "",
    issueDate: draft.issueDate,
    paymentTermId: draft.paymentTermId || undefined,
    currency: draft.currency,
    documentLanguage: draft.documentLanguage === "ar" ? "Ar" : "En",
    notes: draft.notes,
    deliveryMode: draft.deliveryMode === "text" ? "Text" : "Batches",
    deliveryText: draft.deliveryMode === "text" ? draft.deliveryText.trim() : "",
    deliveryPlace: draft.deliveryPlace.trim(),
    paymentTermsText: draft.paymentTermsText.trim(),
    orderDiscountPercent: draft.orderDiscountPercent,
    taxPercent: draft.taxPercent,
    otherTaxEnabled: draft.otherTaxEnabled,
    otherTaxPercent: draft.otherTaxEnabled ? draft.otherTaxPercent : 0,
    bankAccountIds: draft.bankAccountIds,
    lines: draft.lines.map((line, lineIndex) => ({
      id: line.id,
      sortOrder: lineIndex,
      materialId: line.productId ?? line.materialId,
      ratePerKg: line.ratePerKg,
      discountPercent: line.discountPercent,
      packaging: line.packaging.map((row, rowIndex) => ({
        id: row.id,
        sortOrder: rowIndex,
        packageTypeId: row.packageTypeId,
        weightPerPackageKg: row.weightPerPackageKg,
        packages: row.packages,
      })),
    })),
    // Text delivery has no schedule: the batches are never sent, whatever is left in the draft.
    deliveryBatches: (draft.deliveryMode === "text" ? [] : draft.delivery).map((batch) => ({
      id: batch.id,
      batchNumber: batch.batchNumber,
      deliveryDate: batch.date,
      allocations: batch.allocations
        .filter((allocation) => allocation.packages > 0)
        .map((allocation) => ({
          offerLineId: draft.lines.find((line) =>
            line.packaging.some((row) => row.id === allocation.packagingRowId),
          )?.id,
          offerLinePackagingId: allocation.packagingRowId,
          materialId: allocation.productId ?? allocation.materialId,
          packageTypeId: allocation.packageTypeId,
          packages: allocation.packages,
        })),
    })),
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
    const pid = (line.productId || (line as any).materialId || "") as string
    for (const row of line.packaging) {
      rows.set(row.id, { productId: pid, row })
    }
  }

  const used = new Map<string, number>()

  return delivery.map((batch) => ({
    ...batch,
    allocations: batch.allocations.flatMap((allocation) => {
      const allocProductId = allocation.productId || (allocation as any).materialId
      if (!allocation.packagingRowId) {
        // legacy allocation: keep while the material exists
        return lines.some((l) => (l.productId || (l as any).materialId) === allocProductId) ? [allocation as any] : []
      }
      const hit = rows.get(allocation.packagingRowId)
      if (!hit) return []
      const left = hit.row.packages - (used.get(hit.row.id) ?? 0)
      const packages = Math.max(0, Math.min(allocation.packages, left))
      if (packages === 0) return []
      used.set(hit.row.id, (used.get(hit.row.id) ?? 0) + packages)
      const pid = hit.productId
      return [
        {
          ...(allocation as any),
          productId: pid,
          materialId: pid,
          packageTypeId: hit.row.packageTypeId,
          packageTypeName: hit.row.packageTypeName,
          weightPerPackageKg: hit.row.weightPerPackageKg,
          packages,
        } as any,
      ]
    }),
  }))
}

/** What the builder already loaded, used to name the lines of a stored offer. */
export type DraftLookup = {
  products?: Product[]
  packageTypes?: PackageType[]
  customers?: Customer[]
}

/**
 * Turns a stored offer back into an editable draft.
 *
 * The API sends a stored offer's lines as draft lines: material and package type ids, but no
 * names. They are resolved from the catalogue, then from the stored document snapshot, so a
 * new version or a duplicate never starts with blank item names.
 */
export function offerToDraft(
  offer: Offer,
  banks: BankAccount[] = [],
  lookup: DraftLookup = {},
): OfferDraft {
  const rowIds = new Map<string, string>()
  const snapshot = offer.document?.items ?? []
  const customer = lookup.customers?.find((item) => item.id === offer.customerId)

  const lines = (offer.lines ?? []).map((line) => {
    const productId = line.productId ?? line.materialId
    const item =
      snapshot.find((entry) => entry.offerLineId === line.id) ??
      snapshot.find((entry) => entry.materialId === productId)
    const product = lookup.products?.find((entry) => entry.id === productId)

    return {
      id: draftId("line"),
      productId,
      materialName: line.materialName ?? product?.name ?? item?.materialName ?? "",
      materialCode: line.materialCode ?? product?.code ?? item?.materialCode ?? "",
      category: line.category ?? product?.category ?? item?.category ?? "",
      ratePerKg: line.ratePerKg ?? 0,
      discountPercent: line.discountPercent ?? 0,
      packaging: (line.packaging ?? []).map((row) => {
        const id = draftId("pack")
        rowIds.set(row.id, id)
        const type = lookup.packageTypes?.find((entry) => entry.id === row.packageTypeId)
        const stored = item?.packaging?.find(
          (entry) => entry.packageTypeId === row.packageTypeId,
        )
        return {
          ...row,
          id,
          packageTypeName:
            row.packageTypeName ?? type?.name ?? stored?.packageTypeName ?? "",
        }
      }),
    }
  })

  return {
    reference: offer.reference,
    customerId: offer.customerId,
    // A new version starts with the customer's contact person when the source
    // offer left the attention line blank.
    attention: offer.attention || customer?.contactPerson || "",
    attentionAr:
      offer.attentionAr ||
      customer?.contactPersonAr ||
      customer?.contactPerson ||
      "",
    taxId: offer.taxId ?? "",
    issueDate: offer.issueDate,
    currency: offer.currency,
    paymentTermId: offer.paymentTermId,
    validityDays: offer.validityDays ?? DEFAULT_VALIDITY_DAYS,
    lines,
    taxPercent: offer.taxPercent,
    otherTaxEnabled: offer.otherTaxEnabled,
    otherTaxPercent: offer.otherTaxEnabled ? OTHER_TAX_PERCENT : 0,
    bankAccountIds: offer.bankAccountIds ?? defaultBankIds(banks),
    orderDiscountPercent: offer.orderDiscountPercent ?? 0,
    offerType: (offer.offerType ?? "Loc") as OfferType,
    sequence: referenceSequence(offer.reference) ?? 0,
    delivery: (offer.delivery ?? []).map((batch) => ({
      ...batch,
      id: draftId("batch"),
      allocations: (batch.allocations ?? []).map((allocation) => {
        // The API names the link `offerLinePackagingId` and the material `materialId`.
        const storedRowId =
          allocation.packagingRowId ??
          (allocation as { offerLinePackagingId?: string }).offerLinePackagingId
        return {
          ...allocation,
          productId: allocation.productId ?? allocation.materialId,
          packagingRowId: storedRowId
            ? (rowIds.get(storedRowId) ?? storedRowId)
            : storedRowId,
        }
      }),
    })),
    deliveryMode: offer.deliveryMode ?? "batches",
    deliveryText: offer.deliveryText ?? "",
    deliveryPlace: offer.deliveryPlace ?? "",
    paymentTermsText: offer.paymentTermsText ?? "",
    notes: offer.notes,
    documentLanguage: offer.documentLanguage,
  }
}
