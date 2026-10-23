import { formatIsoDay, formatWeekday } from "../lib/formatters/date"
import { formatCurrencyLabel } from "../lib/formatters/currency"
import type { PackagingLine } from "../lib/calculations/packaging"
import type { DocumentLanguage } from "./PdfLanguageProvider"

const NUMBER_FORMATTER = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Latin digits with two decimals, the same in both document languages. */
export function formatDocumentNumber(value: number): string {
  return NUMBER_FORMATTER.format(Number.isFinite(value) ? value : 0)
}

/** `21/10/2026` */
export function formatDocumentDate(value: string): string {
  return formatIsoDay(value)
}

/** Weekday name written in the language of the document. */
export function formatDocumentWeekday(
  value: string,
  language: DocumentLanguage,
): string {
  return formatWeekday(value, language === "ar" ? "ar-EG" : "en-US")
}

/**
 * Packaging summary of one material, for example
 * `10 Drums × 210 kg` or `10 براميل × 210 كجم`.
 */
export function formatPackagingSummaryDocument(
  rows: PackagingLine[],
  language: DocumentLanguage,
): string {
  const unit = language === "ar" ? "كجم" : "kg"

  return rows
    .map(
      (row) =>
        `${row.packages} ${row.packageTypeName} × ${row.weightPerPackageKg} ${unit}`,
    )
    .join(" + ")
}

const CATEGORY_NAMES_AR: Record<string, string> = {
  Polyol: "بوليول",
  Iso: "إيزو",
  System: "نظام",
  Additive: "إضافي",
  Material: "خامة",
}

/** Material category written in the language of the document. */
export function translateCategory(
  name: string,
  language: DocumentLanguage,
): string {
  if (language !== "ar") return name
  return CATEGORY_NAMES_AR[name] ?? name
}

/**
 * Currency written in the language of the document. The English document
 * keeps the ISO code, the Arabic one uses the local abbreviation.
 */
export function formatDocumentCurrency(
  currency: string,
  language: DocumentLanguage,
): string {
  return formatCurrencyLabel(currency, language === "ar" ? "ar-EG" : "en-US")
}
