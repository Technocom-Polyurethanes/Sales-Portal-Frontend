import { useTranslation } from "../../../../i18n/I18nProvider"
import OfferDocumentPreview from "../../../../pdf/OfferDocumentPreview"
import type { DocumentLanguage } from "../../../../pdf/PdfLanguageProvider"
import type { OfferDocumentData } from "../../../../pdf/templates/types"

export type LivePreviewProps = {
  data: OfferDocumentData
  language: DocumentLanguage
  onLanguageChange: (language: DocumentLanguage) => void
}

/** Live preview of the printed offer, it follows every builder field. */
export default function LivePreview({
  data,
  language,
  onLanguageChange,
}: LivePreviewProps) {
  const { t } = useTranslation()

  return (
    <aside className="no-print lg:sticky lg:top-20">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-ink">
          {t("offers.builder.preview.title")}
        </h2>

        <div
          role="group"
          aria-label={t("offers.builder.pdfLanguage")}
          className="flex overflow-hidden rounded-md border border-line"
        >
          {(["en", "ar"] as DocumentLanguage[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onLanguageChange(option)}
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
      </div>

      <p className="mb-2 text-xs text-muted">
        {t("offers.builder.preview.hint")}
      </p>

      <div className="max-h-[calc(100vh-11rem)] overflow-auto rounded-md border border-line p-3">
        <OfferDocumentPreview data={data} language={language} />
      </div>
    </aside>
  )
}
