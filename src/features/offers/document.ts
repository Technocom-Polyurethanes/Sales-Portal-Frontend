import { totalPackages } from "../../lib/calculations/packaging"
import { roundMoney } from "../../lib/calculations/round"
import { translateCategory } from "../../pdf/format"
import { formatPackagingSummaryDocument } from "../../pdf/format"
import type { PackagingLine } from "../../lib/calculations/packaging"
import type { Customer } from "../customers/types"
import type { DocumentLanguage } from "../../pdf/PdfLanguageProvider"
import type {
  OfferDocumentBatch,
  OfferDocumentData,
  OfferDocumentLine,
} from "../../pdf/templates/types"
import type {
  BankAccount,
  CompanySettings,
  PackageType,
} from "../settings/types"
import type { DeliveryBatch, Offer } from "./types"

/** The parts of an offer the printed document needs. */
export type DocumentSource = {
  reference: string
  issueDate: string
  dueDate: string
  currency: string
  paymentTermId: string
  customerId: string
  /** Contact person printed in the "Attention" line, empty hides it. */
  attention?: string
  taxId?: string
  lines: {
    productId: string
    materialName: string
    materialCode: string
    category: string
    packaging: PackagingLine[]
    quantityKg: number
    ratePerKg: number
    amount: number
  }[]
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
  delivery: DeliveryBatch[]
  notes: string
}

/** Builds the payload of the printed document. */
export function buildDocumentData(
  source: DocumentSource,
  options: {
    customer: Customer | undefined
    company: CompanySettings
    banks: BankAccount[]
    packageTypes: PackageType[]
    language: DocumentLanguage
    paymentTermLabel: string
  },
): OfferDocumentData {
  const arabic = options.language === "ar"
  const names = new Map(
    options.packageTypes.map((type) => [type.id, type.nameAr]),
  )

  const lines: OfferDocumentLine[] = source.lines.map((line) => {
    const packaging: PackagingLine[] = line.packaging.map((row) => ({
      ...row,
      packageTypeName: arabic
        ? (names.get(row.packageTypeId) ?? row.packageTypeName)
        : row.packageTypeName,
    }))

    return {
      productId: line.productId,
      name: line.materialName,
      code: line.materialCode,
      category: line.category,
      packagingSummary: formatPackagingSummaryDocument(
        packaging,
        options.language,
      ),
      quantityKg: line.quantityKg,
      ratePerKg: line.ratePerKg,
      amount: line.amount,
    }
  })

  const categories = new Map<string, string>()
  for (const line of source.lines) {
    categories.set(line.productId, line.category)
  }

  const delivery: OfferDocumentBatch[] = source.delivery.map((batch) => {
    const allocations = batch.allocations
      .filter((allocation) => categories.has(allocation.productId))
      .map((allocation) => {
        const line = source.lines.find((l) => l.productId === allocation.productId)
        const row = allocation.packagingRowId
          ? line?.packaging.find((r) => r.id === allocation.packagingRowId)
          : undefined
        if (!row) return null
        const baseName = row.packageTypeName ?? allocation.packageTypeName ?? ""
        const typeId = row.packageTypeId ?? allocation.packageTypeId ?? ""
        const packageTypeName = arabic ? (names.get(typeId) ?? baseName) : baseName
        const weightPerPkg = row.weightPerPackageKg ?? allocation.weightPerPackageKg ?? 0
        return {
          label: translateCategory(
            categories.get(allocation.productId) ?? allocation.productId,
            options.language,
          ),
          productId: allocation.productId,
          materialName: line?.materialName ?? "",
          packages: allocation.packages,
          weightKg: roundMoney(allocation.packages * weightPerPkg),
          packageTypeName,
        }
      })
      .filter((allocation): allocation is NonNullable<typeof allocation> => allocation !== null && allocation.packages > 0)

    return {
      batchNumber: batch.batchNumber,
      date: batch.date,
      weekday: "",
      allocations,
      totalPackages: allocations.reduce((sum, item) => sum + item.packages, 0),
      totalWeightKg: roundMoney(
        allocations.reduce((sum, item) => sum + item.weightKg, 0),
      ),
    }
  })

  return {
    companyName: options.company.name,
    companyNameAr: options.company.nameAr,
    tagline: options.company.tagline,
    taglineAr: options.company.taglineAr,
    formCode: options.company.formCode,
    customerName: arabic
      ? (options.customer?.nameAr ?? options.customer?.name ?? "")
      : (options.customer?.name ?? ""),
    customerAddress: options.customer?.address ?? "",
    attention:
      source.attention === undefined
        ? (options.customer?.contactPerson ?? "").trim()
        : source.attention.trim() === ""
          ? ""
          : source.attention.trim(),
    reference: source.reference,
    issueDate: source.issueDate,
    dueDate: source.dueDate,
    paymentTerm: options.paymentTermLabel,
    currency: source.currency,
    taxId: source.taxId ?? "",
    lines,
    subtotal: source.subtotal,
    orderDiscountPercent: source.orderDiscountPercent ?? 0,
    orderDiscount: source.orderDiscount,
    taxPercent: source.taxPercent,
    taxAmount: source.taxAmount,
    otherTaxEnabled: source.otherTaxEnabled,
    otherTaxPercent: source.otherTaxPercent,
    otherTaxAmount: source.otherTaxAmount,
    total: source.total,
    delivery,
    banks: options.banks.map((bank) => ({
      bank: bank.bank,
      branch: bank.branch,
      accountNumber: bank.accountNumber,
      swift: bank.swift,
      iban: bank.iban,
      currency: bank.currency,
    })),
    notes: source.notes,
  }
}

/**
 * Average weight of one package per material. A material may mix packaging
 * types, so the kilograms of a batch follow its share of the ordered packages.
 */
function perPackageWeights(
  lines: DocumentSource["lines"],
): Map<string, number> {
  const packages = new Map<string, number>()
  const kilograms = new Map<string, number>()

  for (const line of lines) {
    packages.set(
      line.productId,
      (packages.get(line.productId) ?? 0) + totalPackages(line.packaging),
    )
    kilograms.set(
      line.productId,
      (kilograms.get(line.productId) ?? 0) + line.quantityKg,
    )
  }

  const weights = new Map<string, number>()
  for (const [productId, count] of packages) {
    weights.set(
      productId,
      count > 0 ? (kilograms.get(productId) ?? 0) / count : 0,
    )
  }
  return weights
}

/** The document source of an offer that is already stored. */
export function offerToDocumentSource(offer: Offer): DocumentSource {
  return {
    reference: offer.reference,
    issueDate: offer.issueDate,
    dueDate: offer.dueDate,
    currency: offer.currency,
    paymentTermId: offer.paymentTermId,
    customerId: offer.customerId,
    taxId: offer.taxId ?? "",
    lines: offer.lines.map((line) => ({
      productId: line.productId,
      materialName: line.materialName,
      materialCode: line.materialCode,
      category: line.category,
      packaging: line.packaging,
      quantityKg: line.quantityKg,
      ratePerKg: line.ratePerKg,
      amount: line.amount,
    })),
    subtotal: offer.totals.subtotal,
    orderDiscountPercent: offer.orderDiscountPercent ?? offer.totals.orderDiscountPercent ?? 0,
    orderDiscount: offer.totals.orderDiscount,
    taxPercent: offer.totals.taxPercent,
    taxAmount: offer.totals.taxAmount,
    otherTaxEnabled: offer.otherTaxEnabled,
    otherTaxPercent: offer.otherTaxEnabled ? 1 : 0,
    otherTaxAmount: offer.totals.otherTaxAmount,
    total: offer.totals.total,
    delivery: offer.delivery,
    notes: offer.notes,
    attention: offer.attention,
  }
}
