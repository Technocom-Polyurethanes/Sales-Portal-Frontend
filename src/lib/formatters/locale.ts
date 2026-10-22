import type { AppLanguage } from "../../i18n/direction"

/** Locales used for numbers and dates. */
export type Locale = "en-US" | "ar-EG"

/** Maps an application language to the locale used for formatting. */
export function localeForLanguage(language: AppLanguage): Locale {
  return language === "ar" ? "ar-EG" : "en-US"
}
