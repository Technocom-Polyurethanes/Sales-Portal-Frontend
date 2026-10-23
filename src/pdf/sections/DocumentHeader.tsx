import type { DocumentLanguage } from "../PdfLanguageProvider"

export type DocumentHeaderProps = {
  companyName: string
  tagline: string
  formCode: string
  title: string
  language: DocumentLanguage
}

/** Logo, form code and document title of the offer. */
export default function DocumentHeader({
  companyName,
  tagline,
  formCode,
  title,
  language,
}: DocumentHeaderProps) {
  const arabic = language === "ar"

  return (
    <>
      <header className="doc-header">
        <div className="doc-logo">
          <span className={`doc-wordmark${arabic ? " doc-wordmark-ar" : ""}`}>
            {companyName}
            <span />
          </span>
          <span className="doc-tagline">{tagline}</span>
        </div>
        <div className="doc-form-code doc-ltr">{formCode}</div>
      </header>
      <h1 className="doc-title">{title}</h1>
    </>
  )
}
