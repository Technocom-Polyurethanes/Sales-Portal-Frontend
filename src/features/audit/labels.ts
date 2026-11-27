import type { TranslateFunction } from "../../i18n/I18nProvider"
import type { TranslationKey } from "../../i18n/types"

function label(
  prefix: "actions" | "categories" | "outcomes",
  value: string,
  t: TranslateFunction,
) {
  if (!value) return ""
  const key = `audit.${prefix}.${value}` as TranslationKey
  const translated = t(key)
  return translated === key ? value : translated
}

export const actionLabel = (action: string, t: TranslateFunction) =>
  label("actions", action, t)

export const categoryLabel = (category: string, t: TranslateFunction) =>
  label("categories", category, t)

export const outcomeLabel = (outcome: string, t: TranslateFunction) =>
  label("outcomes", outcome, t)
