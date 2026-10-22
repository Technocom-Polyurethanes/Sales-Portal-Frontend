import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import type { ReactNode } from "react"

import ar from "./ar.json"
import en from "./en.json"
import {
  DEFAULT_LANGUAGE,
  getDirection,
  readStoredLanguage,
  storeLanguage,
  type AppLanguage,
  type Direction,
} from "./direction"
import { translate } from "./translate"
import type { TranslationKey, TranslationParams } from "./types"

export type TranslateFunction = (
  key: TranslationKey,
  params?: TranslationParams,
) => string

type I18nContextValue = {
  language: AppLanguage
  direction: Direction
  setLanguage: (language: AppLanguage) => void
  toggleLanguage: () => void
  t: TranslateFunction
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(readStoredLanguage)

  useEffect(() => {
    storeLanguage(language)
    document.documentElement.lang = language
    document.documentElement.dir = getDirection(language)
  }, [language])

  const setLanguage = useCallback(
    (next: AppLanguage) => setLanguageState(next),
    [],
  )
  const toggleLanguage = useCallback(
    () => setLanguageState((current) => (current === "en" ? "ar" : "en")),
    [],
  )

  const value = useMemo<I18nContextValue>(() => {
    const tree = language === "ar" ? ar : en
    return {
      language,
      direction: getDirection(language),
      setLanguage,
      toggleLanguage,
      t: (key, params) => translate(tree, en, key, params),
    }
  }, [language, setLanguage, toggleLanguage])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext)
  if (!context) throw new Error("useI18n must be used inside <I18nProvider>")
  return context
}

/** Convenience hook for components that only need the translate function. */
export function useTranslation(): I18nContextValue {
  return useI18n()
}

export { DEFAULT_LANGUAGE }
