import type { TranslateFunction } from "../../i18n/I18nProvider"
import type { TranslationKey } from "../../i18n/types"

export function stateLabel(
  group: "overall" | "database" | "live",
  value: string,
  t: TranslateFunction,
) {
  const key = `system.states.${group}.${value}` as TranslationKey
  const translated = t(key)
  return translated === key ? value : translated
}
