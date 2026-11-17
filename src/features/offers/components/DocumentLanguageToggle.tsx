import { useTranslation } from "../../../i18n/I18nProvider"
import type { DocumentLanguage } from "../../../pdf/PdfLanguageProvider"

export type DocumentLanguageToggleProps = {
  language: DocumentLanguage
  onChange: (language: DocumentLanguage) => void
}

/** English / Arabic switch of the printed document, shared by the builder and the offer view. */
export default function DocumentLanguageToggle({
  language,
  onChange,
}: DocumentLanguageToggleProps) {
  const { t } = useTranslation()

  return (
    <div
      role="group"
      aria-label={t("offers.builder.pdfLanguage")}
      className="flex overflow-hidden rounded-md border border-line"
    >
      {(["en", "ar"] as DocumentLanguage[]).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          aria-pressed={language === option}
          className={`px-2.5 py-1 text-xs font-medium transition-colors ${
            language === option
              ? "bg-primary text-white"
              : "bg-surface text-muted hover:text-ink"
          }`}
        >
          {option === "en" ? t("common.english") : t("common.arabic")}
        </button>
      ))}
    </div>
  )
}
