import "./document.css"
import "./print.css"

import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

import {
  formatDocumentCurrency,
  formatDocumentDate,
  formatDocumentNumber,
  formatDocumentValidity,
  formatDocumentWeekday,
  translateCategory,
} from "./format"
import type { DocumentLanguage } from "./PdfLanguageProvider"
import BankAccountsTable from "./sections/BankAccountsTable"
import BillToBlock from "./sections/BillToBlock"
import DeliveryScheduleTable from "./sections/DeliveryScheduleTable"
import DocumentFooter from "./sections/DocumentFooter"
import DocumentHeader from "./sections/DocumentHeader"
import ItemsTable from "./sections/ItemsTable"
import NotesBlock from "./sections/NotesBlock"
import PaymentTermsBlock from "./sections/PaymentTermsBlock"
import ReferenceTable from "./sections/ReferenceTable"
import TermsAndConditions from "./sections/TermsAndConditions"
import TextBlock from "./sections/TextBlock"
import TotalsBlock from "./sections/TotalsBlock"
import { paginate } from "./paginate"
import { getTemplate } from "./templates"
import type { OfferDocumentData } from "./templates/types"
import type { TotalsRow } from "./sections/TotalsBlock"
import type { ReferenceRow } from "./sections/ReferenceTable"

export type OfferDocumentProps = {
  data: OfferDocumentData
  language: DocumentLanguage
}

function buildReferenceRows(
  data: OfferDocumentData,
  template: ReturnType<typeof getTemplate>,
  language: DocumentLanguage,
): ReferenceRow[] {
  const validityDays = data.validityDays ?? 0
  const validity: ReferenceRow[] =
    validityDays > 0 && data.expiryDate
      ? [
          {
            label: template.validity,
            value: formatDocumentValidity(
              validityDays,
              data.expiryDate,
              language,
            ),
          },
        ]
      : []

  return [
    { label: template.reference, value: data.reference, ltr: true },
    {
      label: template.date,
      value: formatDocumentDate(data.issueDate),
      ltr: true,
    },
    ...validity,
  ]
}

function buildTotalsRows(
  data: OfferDocumentData,
  template: ReturnType<typeof getTemplate>,
  language: DocumentLanguage,
): TotalsRow[] {
  const currency = formatDocumentCurrency(data.currency, language)

  const rows: TotalsRow[] = [
    {
      label: template.subtotal,
      value: formatDocumentNumber(data.subtotal),
    },
  ]

  if (data.orderDiscount > 0) {
    rows.push({
      label: `${template.discount} (${data.orderDiscountPercent}%)`,
      value: `- ${formatDocumentNumber(data.orderDiscount)}`,
    })
  }

  if (data.taxPercent > 0) {
    rows.push({
      label: `${template.tax} ${data.taxPercent}%`,
      value: formatDocumentNumber(data.taxAmount),
    })
  }

  if (data.otherTaxEnabled && data.otherTaxPercent > 0) {
    rows.push({
      label: template.otherTax,
      value: `- ${formatDocumentNumber(data.otherTaxAmount)}`,
      variant: "deduction",
    })
  }

  rows.push({
    label: template.itemsTotalLabel,
    value: formatDocumentNumber(data.total),
    currency,
    variant: "grand",
  })

  return rows
}

function deliveryColumns(data: OfferDocumentData, language: DocumentLanguage): Array<{ key: string; label: string }> {
  const map = new Map<string, string>()
  for (const line of data.lines) {
    const key = line.productId ?? line.name
    if (!key) continue
    const label = `${translateCategory(line.category, language)} — ${line.name}`
    if (!map.has(key)) map.set(key, label)
  }
  for (const batch of data.delivery) {
    for (const allocation of batch.allocations) {
      const key = allocation.productId ?? allocation.label
      if (!key) continue
      if (!map.has(key)) {
        map.set(key, allocation.label)
      }
    }
  }
  return Array.from(map.entries()).map(([key, label]) => ({ key, label }))
}

/**
 * The printed offer. The English document is left to right, the Arabic one is
 * a full mirror of it: only the reference number keeps its own direction.
 *
 * The document is a stack of real A4 sheets. The blocks are rendered once into
 * a detached element and `paginate` copies them page by page, so the letterhead
 * and the footer are repeated on every sheet and the preview shows exactly the
 * pages the printer receives.
 */
function OfferDocument({ data, language }: OfferDocumentProps) {
  const template = getTemplate(language)
  const arabic = language === "ar"
  const referenceRows = buildReferenceRows(data, template, language)
  const totalsRows = buildTotalsRows(data, template, language)
  const columns = deliveryColumns(data, language)
  const currency = formatDocumentCurrency(data.currency, language)
  const weightUnit = arabic ? "كجم" : "kg"

  const batches = data.delivery.map((batch) => ({
    ...batch,
    weekday: formatDocumentWeekday(batch.date, language),
  }))

  const [source] = useState(() => document.createElement("div"))
  const pagesRef = useRef<HTMLDivElement>(null)

  const layoutPages = useCallback(() => {
    if (pagesRef.current) paginate(source, pagesRef.current)
  }, [source])

  // The source has just been updated by React: lay the pages out again.
  useLayoutEffect(layoutPages)

  // Fonts change the height of every row, so the pages are laid out again
  // once they are loaded.
  useEffect(() => {
    if (!("fonts" in document)) return

    let active = true
    void document.fonts.ready.then(() => {
      if (active) layoutPages()
    })
    document.fonts.addEventListener("loadingdone", layoutPages)

    return () => {
      active = false
      document.fonts.removeEventListener("loadingdone", layoutPages)
    }
  }, [layoutPages])

  return (
    <article
      className="offer-document"
      dir={arabic ? "rtl" : "ltr"}
      lang={language}
    >
      <div className="doc-pages" ref={pagesRef} />

      {createPortal(
        <>
          <div data-doc-part="header">
            <DocumentHeader
              companyName={arabic ? data.companyNameAr : data.companyName}
              tagline={arabic ? data.taglineAr : data.tagline}
              formCode={data.formCode}
              language={language}
            />
          </div>

          <div data-doc-part="footer">
            <DocumentFooter />
          </div>

          <div data-doc-unit>
            <div className="doc-intro">
              <h1 className="doc-title">{template.title}</h1>

              <div className="doc-top">
                <BillToBlock
                  heading={template.billTo}
                  customerName={arabic ? (data.customerNameAr ?? data.customerName) : data.customerName}
                  address={arabic ? (data.customerAddressAr ?? data.customerAddress) : data.customerAddress}
                  taxId={data.taxId}
                  taxIdLabel={template.taxId}
                  attention={arabic ? (data.attentionAr ?? data.attention) : data.attention}
                  attentionLabel={template.attention}
                />
                <ReferenceTable rows={referenceRows} />
              </div>
            </div>
          </div>

          <div data-doc-unit>
            <ItemsTable
              headings={{
                item: template.item,
                quantity: template.quantity,
                rate: template.rate,
                amount: template.amount,
                packaging: template.packaging,
              }}
              lines={data.lines}
              currency={currency}
              weightUnit={weightUnit}
              formatNumber={(value) =>
                (value ?? 0).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              }
            />
          </div>

          <div data-doc-unit>
            <div className="doc-summary-row">
              <PaymentTermsBlock
                heading={template.terms}
                term={data.paymentTerm}
                conditions={data.paymentTermsText}
              />
              <TotalsBlock rows={totalsRows} />
            </div>
          </div>

          <div data-doc-unit data-doc-keep>
            <DeliveryScheduleTable
              heading={template.schedule}
              headings={{
                batch: template.batch,
                deliveryDate: template.deliveryDate,
                packages: template.packages,
                totalWeight: template.totalWeight,
                total: template.deliveryTotalLabel,
              }}
              batches={batches}
              columns={columns}
              weightUnit={weightUnit}
              formatDate={formatDocumentDate}
              formatNumber={(value) =>
                (value ?? 0).toLocaleString("en-US", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })
              }
              language={language}
              source={data}
            />
          </div>

          {data.deliveryMode === "text" && (
            <div data-doc-unit>
              <TextBlock heading={template.delivery} text={data.deliveryText} />
            </div>
          )}

          <div data-doc-unit>
            <TextBlock heading={template.deliveryPlace} text={data.deliveryPlace} />
          </div>

          <div data-doc-unit data-doc-keep>
            <BankAccountsTable
              heading={template.bankDetails}
              headings={{
                bank: template.bank,
                branch: template.branch,
                accountNumber: template.accountNumber,
                swift: template.swift,
                iban: template.iban,
                currency: template.currency,
              }}
              banks={data.banks}
              formatCurrency={(value) => formatDocumentCurrency(value, language)}
            />
          </div>

          <div data-doc-unit>
            <NotesBlock heading={template.notes} notes={data.notes} />
          </div>

          <div data-doc-unit data-doc-keep>
            <TermsAndConditions
              heading={template.termsAndConditionsHeading}
              terms={template.termsAndConditions}
            />
          </div>
        </>,
        source,
      )}
    </article>
  )
}

export default memo(OfferDocument)
