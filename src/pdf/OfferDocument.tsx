import "./document.css"
import "./print.css"

import {
  formatDocumentCurrency,
  formatDocumentDate,
  formatDocumentNumber,
  formatDocumentWeekday,
} from "./format"
import type { DocumentLanguage } from "./PdfLanguageProvider"
import BankAccountsTable from "./sections/BankAccountsTable"
import BillToBlock from "./sections/BillToBlock"
import DeliveryScheduleTable from "./sections/DeliveryScheduleTable"
import DocumentHeader from "./sections/DocumentHeader"
import ItemsTable from "./sections/ItemsTable"
import NotesBlock from "./sections/NotesBlock"
import ReferenceTable from "./sections/ReferenceTable"
import TotalsBlock from "./sections/TotalsBlock"
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
): ReferenceRow[] {
  return [
    { label: template.reference, value: data.reference, ltr: true },
    {
      label: template.date,
      value: formatDocumentDate(data.issueDate),
      ltr: true,
    },
    { label: template.terms, value: data.paymentTerm },
    {
      label: template.dueDate,
      value: formatDocumentDate(data.dueDate),
      ltr: true,
    },
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
    label: template.total,
    value: formatDocumentNumber(data.total),
    currency,
    variant: "grand",
  })

  return rows
}

function deliveryColumns(data: OfferDocumentData): string[] {
  const columns: string[] = []
  for (const batch of data.delivery) {
    for (const allocation of batch.allocations) {
      if (!columns.includes(allocation.label)) columns.push(allocation.label)
    }
  }
  return columns
}

/**
 * The printed offer. The English document is left to right, the Arabic one is
 * a full mirror of it: only the reference number keeps its own direction.
 */
export default function OfferDocument({ data, language }: OfferDocumentProps) {
  const template = getTemplate(language)
  const arabic = language === "ar"
  const referenceRows = buildReferenceRows(data, template)
  const totalsRows = buildTotalsRows(data, template, language)
  const columns = deliveryColumns(data)
  const currency = formatDocumentCurrency(data.currency, language)
  const weightUnit = arabic ? "كجم" : "kg"

  const batches = data.delivery.map((batch) => ({
    ...batch,
    weekday: formatDocumentWeekday(batch.date, language),
  }))

  return (
    <article
      className="offer-document"
      dir={arabic ? "rtl" : "ltr"}
      lang={language}
    >
      <DocumentHeader
        companyName={arabic ? data.companyNameAr : data.companyName}
        tagline={arabic ? data.taglineAr : data.tagline}
        formCode={data.formCode}
        title={template.title}
        language={language}
      />

      <div className="doc-top">
        <BillToBlock
          heading={template.billTo}
          customerName={data.customerName}
          address={data.customerAddress}
          taxId={data.taxId}
          taxIdLabel={template.taxId ?? "Tax ID"}
          attention={data.attention}
          attentionLabel={template.attention}
        />
        <ReferenceTable rows={referenceRows} />
      </div>

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
          value.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        }
      />

      <TotalsBlock rows={totalsRows} />

      <DeliveryScheduleTable
        heading={template.schedule}
        headings={{
          batch: template.batch,
          deliveryDate: template.deliveryDate,
          packages: template.packages,
          totalWeight: template.totalWeight,
          total: template.total,
        }}
        batches={batches}
        columns={columns}
        weightUnit={weightUnit}
        formatDate={formatDocumentDate}
        formatNumber={formatDocumentNumber}
        language={language}
        source={data}
      />

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

      <NotesBlock heading={template.notes} notes={data.notes} />

      <footer className="doc-footer">
        {arabic ? data.companyNameAr : data.companyName} · {template.page}
      </footer>
    </article>
  )
}
