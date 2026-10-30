import type { DocumentLanguage } from "../PdfLanguageProvider"

export type DocumentHeaderProps = {
  companyName: string
  tagline: string
  formCode: string
  title: string
  language: DocumentLanguage
}

/**
 * Official bilingual Technocom letterhead header + document title.
 * Locked to LTR so English branding is always left and Arabic branding is always right,
 * matching the physical pre-printed letterhead.
 */
export default function DocumentHeader({
  title,
}: DocumentHeaderProps) {
  return (
    <>
      <header className="doc-header" dir="ltr">
        {/* Left: English Branding */}
        <div className="doc-brand doc-brand--en">
          <span className="doc-wordmark-en">TECHNOCOM</span>
          <span className="doc-tagline-en">For Commercial Agencies</span>
        </div>

        {/* Right: Arabic Branding with Kashida */}
        <div className="doc-brand doc-brand--ar" dir="rtl">
          <span className="doc-wordmark-ar">تـكـنـوكـوم</span>
          <span className="doc-tagline-ar">للتوكيلات التجارية</span>
        </div>
      </header>

      <h1 className="doc-title">{title}</h1>
    </>
  )
}