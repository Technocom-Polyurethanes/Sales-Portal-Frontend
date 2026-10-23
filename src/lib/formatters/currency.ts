import type { Locale } from "./locale"

/** Local abbreviations of the currencies used by the workspace. */
const CURRENCY_NAMES_AR: Record<string, string> = {
  EGP: "ج.م",
  USD: "دولار",
  EUR: "يورو",
  SAR: "ريال",
  AED: "درهم",
}

/**
 * Currency label written for the given locale. The English interface keeps
 * the ISO code, the Arabic one uses the local abbreviation.
 */
export function formatCurrencyLabel(
  currency: string,
  locale: Locale = "en-US",
): string {
  if (locale === "en-US") return currency
  return CURRENCY_NAMES_AR[currency] ?? currency
}
