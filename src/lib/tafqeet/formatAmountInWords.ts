import { currencyDefinition, type ArabicForms } from "./currencies"
import { arabicNumber, englishNumber } from "./numbers"

export type TafqeetLanguage = "ar" | "en"

function arabicCurrencyPhrase(
  count: number,
  forms: ArabicForms,
  feminine: boolean,
): string {
  const lastTwo = count % 100
  if (lastTwo === 1) {
    if (count !== 1) return `${arabicNumber(count, feminine)} ${forms.one}`
    const prefix = forms.one === forms.dual ? "واحد " : ""
    return `${prefix}${forms.one}`
  }
  if (lastTwo === 2) {
    if (count !== 2) return `${arabicNumber(count, feminine)} ${forms.dual}`
    const prefix = forms.one === forms.dual ? "اثنان " : ""
    return `${prefix}${forms.dual}`
  }
  if (lastTwo >= 3 && lastTwo <= 10) {
    return `${arabicNumber(count, feminine)} ${forms.plural}`
  }
  if (lastTwo >= 11) {
    return `${arabicNumber(count, feminine)} ${forms.accusative}`
  }
  return `${arabicNumber(count, feminine)} ${forms.one}`
}

function arabicAmount(major: number, minor: number, code: string): string {
  const definition = currencyDefinition(code)
  const parts: string[] = []
  if (major) {
    parts.push(
      arabicCurrencyPhrase(
        major,
        definition.arMajor,
        definition.arFeminine,
      ),
    )
  }
  if (minor) {
    parts.push(
      arabicCurrencyPhrase(
        minor,
        definition.arMinor,
<<<<<<< HEAD
        definition.arMinorFeminine ?? definition.arFeminine,
=======
        definition.arFeminine,
>>>>>>> f5980e63d092efaa11e184b56660762b7fbd60b1
      ),
    )
  }
  return `فقط ${parts.join(" و")} لا غير`
}

function englishAmount(major: number, minor: number, code: string): string {
  const definition = currencyDefinition(code)
  const parts: string[] = []
  if (major) {
    const unit = major === 1 ? definition.enMajor[0] : definition.enMajor[1]
    parts.push(`${englishNumber(major)} ${unit}`)
  }
  if (minor) {
    const unit = minor === 1 ? definition.enMinor[0] : definition.enMinor[1]
    parts.push(`${englishNumber(minor)} ${unit}`)
  }
  return `${parts.join(" and ")} Only`
}

export function formatAmountInWords(
  amount: number,
  currency: string,
  language: TafqeetLanguage,
): string {
  if (!Number.isFinite(amount)) return ""
  const totalMinor = Math.round(Math.abs(amount) * 100)
  if (totalMinor === 0) return ""

  const major = Math.floor(totalMinor / 100)
  const minor = totalMinor % 100
  return language === "ar"
    ? arabicAmount(major, minor, currency)
    : englishAmount(major, minor, currency)
}
