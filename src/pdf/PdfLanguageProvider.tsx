import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import type { ReactNode } from "react"

export type DocumentLanguage = "en" | "ar"

export const PDF_LANGUAGE_STORAGE_KEY = "technocom.pdf-language"

type PdfLanguageContextValue = {
  language: DocumentLanguage
  setLanguage: (language: DocumentLanguage) => void
  toggleLanguage: () => void
}

const PdfLanguageContext = createContext<PdfLanguageContextValue | null>(null)

function readStoredLanguage(): DocumentLanguage {
  if (typeof localStorage === "undefined") return "en"
  const stored = localStorage.getItem(PDF_LANGUAGE_STORAGE_KEY)
  return stored === "ar" ? "ar" : "en"
}

/**
 * The language of the printed document. It is deliberately independent from
 * the application language.
 */
export function PdfLanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] =
    useState<DocumentLanguage>(readStoredLanguage)

  useEffect(() => {
    localStorage.setItem(PDF_LANGUAGE_STORAGE_KEY, language)
  }, [language])

  const setLanguage = useCallback(
    (next: DocumentLanguage) => setLanguageState(next),
    [],
  )
  const toggleLanguage = useCallback(
    () => setLanguageState((current) => (current === "en" ? "ar" : "en")),
    [],
  )

  const value = useMemo(
    () => ({ language, setLanguage, toggleLanguage }),
    [language, setLanguage, toggleLanguage],
  )

  return (
    <PdfLanguageContext.Provider value={value}>
      {children}
    </PdfLanguageContext.Provider>
  )
}

export function usePdfLanguage(): PdfLanguageContextValue {
  const context = useContext(PdfLanguageContext)
  if (!context) {
    throw new Error("usePdfLanguage must be used inside <PdfLanguageProvider>")
  }
  return context
}
