import type { DocumentLanguage } from "../PdfLanguageProvider"
import { arabicTemplate } from "./ar"
import { englishTemplate } from "./en"
import type { OfferTemplate } from "./types"

/** Returns the template of the requested document language. */
export function getTemplate(language: DocumentLanguage): OfferTemplate {
  return language === "ar" ? arabicTemplate : englishTemplate
}

export * from "./types"
