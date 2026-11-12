
import { roundMoney } from "../../lib/calculations/round"
import { expiryDateFrom, normalizeValidityDays } from "../../lib/calculations/validity"
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
import type { DeliveryBatch, DeliveryMode, Offer } from "./types"

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
  /** Arabic contact person, `undefined` falls back to the customer record. */
  attentionAr?: string
  /** Days the offer stays valid, 0 or missing prints no validity row. */
  validityDays?: number
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
  /** Missing means batches. */
  deliveryMode?: DeliveryMode
  deliveryText?: string
  deliveryPlace?: string
  paymentTermsText?: string
  notes: string
}

/** Builds the payload of the printed document. */
export function buildDocumentData(source: DocumentSource,
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
    (options.packageTypes ?? []).map((type) => [type.id, type.nameAr]),
  )

  const lines: OfferDocumentLine[] = (source.lines ?? []).map((line) => {
    const packaging: PackagingLine[] = (line.packaging ?? []).map((row) => ({
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
  for (const line of (source.lines ?? [])) {
    categories.set(line.productId, line.category)
  }

  const scheduledBatches = source.deliveryMode === "text" ? [] : (source.delivery ?? [])
  const delivery: OfferDocumentBatch[] = scheduledBatches.map((batch) => {
    const allocations = (batch.allocations ?? [])
      .filter((allocation: any) => categories.has(allocation.productId || allocation.materialId))
      .map((allocation: any) => {
        const allocPid = allocation.productId || allocation.materialId
        const line = (source.lines ?? []).find((l: any) => l.productId === allocPid || l.materialId === allocPid)
        const row = allocation.packagingRowId
          ? (line?.packaging ?? []).find((r: any) => r.id === allocation.packagingRowId)
          : undefined
        if (!row) return null
        const baseName = row.packageTypeName ?? allocation.packageTypeName ?? ""
        const typeId = row.packageTypeId ?? allocation.packageTypeId ?? ""
        const packageTypeName = arabic ? (names.get(typeId) ?? baseName) : baseName
        const weightPerPkg = row.weightPerPackageKg ?? allocation.weightPerPackageKg ?? 0
        return {
          label: translateCategory(
            (categories.get(allocPid) ?? allocPid) as string,
            options.language,
          ),
          productId: allocPid,
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
    customerName: options.customer?.name ?? "",
    customerNameAr: options.customer?.nameAr ?? "",
    customerAddress: options.customer?.address ?? "",
    customerAddressAr: options.customer?.addressAr ?? "",
    attention:
      source.attention === undefined
        ? (options.customer?.contactPerson ?? "").trim()
        : String(source.attention).trim() === ""
          ? ""
          : String(source.attention).trim(),
    attentionAr:
      source.attentionAr === undefined
        ? (options.customer?.contactPersonAr ?? options.customer?.contactPerson ?? "").trim()
        : String(source.attentionAr).trim() === ""
          ? ""
          : String(source.attentionAr).trim(),
    reference: source.reference,
    issueDate: source.issueDate,
    dueDate: source.dueDate,
    paymentTerm: options.paymentTermLabel,
    paymentTermsText: (source.paymentTermsText ?? "").trim(),
    deliveryMode: source.deliveryMode ?? "batches",
    deliveryText:
      source.deliveryMode === "text" ? (source.deliveryText ?? "").trim() : "",
    deliveryPlace: (source.deliveryPlace ?? "").trim(),
    validityDays: normalizeValidityDays(source.validityDays),
    expiryDate: expiryDateFrom(source.issueDate, source.validityDays ?? 0),
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
    banks: (options.banks ?? []).map((bank) => ({
      bank: arabic ? (bank.bankAr ?? bank.bank) : bank.bank,
      branch: arabic ? (bank.branchAr ?? bank.branch) : bank.branch,
      accountNumber: bank.accountNumber,
      swift: bank.swift,
      iban: bank.iban,
      currency: bank.currency,
    })),
    notes: source.notes,
  }
}



// Inside src/features/offers/document.ts

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
    lines: (offer.lines ?? []).map((line: any) => {
      // Find matching item from the document preview payload if present
      const doc = (offer as any).document || (offer as any).documentDto
      const docItem = (doc?.items ?? []).find(
        (di: any) => di.offerLineId === line.id || di.materialId === (line.materialId || line.productId) || di.materialId === line.productId
      )

      // Calculate total quantity Kg from packaging rows if not explicitly provided
      const calculatedQtyKg = (line.packaging ?? []).reduce(
        (sum: number, pkg: any) => sum + (pkg.packages ?? 0) * (pkg.weightPerPackageKg ?? 0),
        0
      )

      const qtyKg = docItem?.quantityKg ?? line.quantityKg ?? calculatedQtyKg ?? 0
      const rate = line.ratePerKg ?? 0
      const lineAmount = docItem?.amount ?? line.amount ?? (qtyKg * rate)

      return {
        productId: (line.materialId ?? line.productId ?? "") as string,
        materialName: docItem?.materialName ?? line.materialName ?? "Material",
        materialCode: docItem?.materialCode ?? line.materialCode ?? "",
        category: docItem?.category ?? line.category ?? "",
        packaging: (line.packaging ?? []).map((pkg: any) => ({
          id: pkg.id ?? "",
          packageTypeId: pkg.packageTypeId ?? "",
          packageTypeName: pkg.packageTypeName ?? "Drum",
          weightPerPackageKg: pkg.weightPerPackageKg ?? 0,
          packages: pkg.packages ?? 0,
        })),
        quantityKg: qtyKg,
        ratePerKg: rate,
        amount: lineAmount,
      }
    }),
    // Pull financial fields directly from root level (with fallback to totals object if present)
    subtotal: (offer as any).subtotal ?? (offer as any).totals?.subtotal ?? 0,
    orderDiscountPercent: (offer as any).orderDiscountPercent ?? (offer as any).totals?.orderDiscountPercent ?? 0,
    orderDiscount: (offer as any).orderDiscount ?? (offer as any).totals?.orderDiscount ?? 0,
    taxPercent: (offer as any).taxPercent ?? (offer as any).totals?.taxPercent ?? 0,
    taxAmount: (offer as any).taxAmount ?? (offer as any).totals?.taxAmount ?? 0,
    otherTaxEnabled: (offer as any).otherTaxEnabled ?? false,
    otherTaxPercent: (offer as any).otherTaxPercent ?? (offer as any).totals?.otherTaxPercent ?? 1,
    otherTaxAmount: (offer as any).otherTaxAmount ?? (offer as any).totals?.otherTaxAmount ?? 0,
    total: (offer as any).total ?? (offer as any).totals?.total ?? 0,
    delivery: ((offer as any).deliveryBatches ?? (offer as any).delivery ?? []).map((batch: any) => ({
      id: batch.id ?? "",
      batchNumber: batch.batchNumber ?? 1,
      date: batch.date ?? batch.deliveryDate ?? "",
      allocations: (batch.allocations ?? []).map((alloc: any) => ({
        productId: alloc.productId ?? alloc.materialId ?? "",
        packagingRowId: alloc.packagingRowId ?? alloc.offerLinePackagingId ?? "",
        packageTypeId: alloc.packageTypeId ?? "",
        packageTypeName: alloc.packageTypeName ?? "",
        weightPerPackageKg: alloc.weightPerPackageKg ?? 0,
        packages: alloc.packages ?? 0,
      })),
    })),
    deliveryMode: offer.deliveryMode ?? "batches",
    deliveryText: offer.deliveryText ?? "",
    deliveryPlace: offer.deliveryPlace ?? "",
    paymentTermsText: offer.paymentTermsText ?? "",
    notes: offer.notes ?? "",
    attention: offer.attention ?? "",
    attentionAr: offer.attentionAr,
    validityDays: offer.validityDays,
  }
}
