import { formatCurrencyLabel } from "./currency"
import type { Locale } from "./locale"

// Arabic uses Latin digits but no thousands separator: only the dot decimal.
const NUMBERING_LOCALES: Record<Locale, string> = {
  "en-US": "en-US",
  "ar-EG": "ar-EG-u-nu-latn",
}

const LOCALE_FORMATTERS: Record<Locale, Intl.NumberFormat> = {
  "en-US": new Intl.NumberFormat(NUMBERING_LOCALES["en-US"], {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }),
  "ar-EG": new Intl.NumberFormat(NUMBERING_LOCALES["ar-EG"], {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false,
  }),
}

/** Formats a number with two decimals. */
export function formatNumber(value: number, locale: Locale = "en-US"): string {
  const safe = Number.isFinite(value) ? value : 0
  return LOCALE_FORMATTERS[locale].format(safe)
}

/** Formats a number without forcing decimals when the value is whole. */
export function formatCompactNumber(
  value: number,
  locale: Locale = "en-US",
): string {
  const safe = Number.isFinite(value) ? value : 0
  return new Intl.NumberFormat(NUMBERING_LOCALES[locale], {
    maximumFractionDigits: 2,
    useGrouping: locale !== "ar-EG",
  }).format(safe)
}

/** Formats a monetary amount with the currency label appended. */
export function formatCurrency(
  value: number,
  currency: string,
  locale: Locale = "en-US",
): string {
  return `${formatNumber(value, locale)} ${formatCurrencyLabel(currency, locale)}`
}

/** Formats a weight in kilograms. */
export function formatWeight(value: number, locale: Locale = "en-US"): string {
  return `${formatNumber(value, locale)} kg`
}

/** Formats a percentage, dropping the decimal part when it is whole. */
export function formatPercent(value: number, locale: Locale = "en-US"): string {
  const safe = Number.isFinite(value) ? value : 0
  const formatted = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
  }).format(safe)
  return `${formatted}%`
}
