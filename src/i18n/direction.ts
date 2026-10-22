export const APP_LANGUAGES = ["en", "ar"] as const

export type AppLanguage = typeof APP_LANGUAGES[number]

export type Direction = "ltr" | "rtl"

export const DEFAULT_LANGUAGE: AppLanguage = "en"

export const LANGUAGE_STORAGE_KEY = "technocom.app-language"

export function isAppLanguage(value: unknown): value is AppLanguage {
  return (
    typeof value === "string" &&
    (APP_LANGUAGES as readonly string[]).includes(value)
  )
}

/** Arabic is right-to-left, everything else is left-to-right. */
export function getDirection(language: AppLanguage): Direction {
  return language === "ar" ? "rtl" : "ltr"
}

export function otherLanguage(language: AppLanguage): AppLanguage {
  return language === "en" ? "ar" : "en"
}

export function readStoredLanguage(): AppLanguage {
  if (typeof localStorage === "undefined") return DEFAULT_LANGUAGE
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
  return isAppLanguage(stored) ? stored : DEFAULT_LANGUAGE
}

export function storeLanguage(language: AppLanguage): void {
  if (typeof localStorage === "undefined") return
  localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
}
