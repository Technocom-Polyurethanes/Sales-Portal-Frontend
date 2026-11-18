import { getPaymentTerm } from "../../lib/calculations/dueDate"
import type { PaymentTerm } from "../settings/types"

type Language = "en" | "ar"

/** The backend term ids are GUIDs, so the catalogue is searched first and the built-in list is the fallback. */
export function findPaymentTerm(
  terms: PaymentTerm[] | undefined,
  termId: string,
): PaymentTerm {
  const found = terms?.find((term) => term.id === termId)
  if (found) return found
  const fallback = getPaymentTerm(termId)
  return { ...fallback, code: fallback.id }
}

export function paymentTermLabel(term: PaymentTerm, language: Language): string {
  return language === "ar" ? term.labelAr || term.label : term.label
}

/** The conditions of a term in the document language, with the days filled in. Blank means none. */
export function paymentTermConditions(term: PaymentTerm, language: Language): string {
  const text = language === "ar" ? term.conditionsAr || term.conditions : term.conditions
  return (text ?? "").trim().split("{days}").join(String(term.days ?? 0))
}

/**
 * Replaces the offer's payment conditions with the new term's default only while the text is still
 * the unedited default of the previous term; a custom wording typed for the offer is kept.
 */
export function nextPaymentTermsText(options: {
  current: string
  previousTerm?: PaymentTerm
  previousLanguage: Language
  nextTerm: PaymentTerm
  nextLanguage: Language
}): string {
  const current = options.current.trim()
  const unedited =
    !options.previousTerm ||
    current === paymentTermConditions(options.previousTerm, options.previousLanguage) ||
    current === paymentTermConditions(options.previousTerm, "en") ||
    current === paymentTermConditions(options.previousTerm, "ar")
  return unedited
    ? paymentTermConditions(options.nextTerm, options.nextLanguage)
    : options.current
}
