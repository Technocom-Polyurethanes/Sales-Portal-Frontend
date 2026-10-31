import { useTranslation } from "../../../../i18n/I18nProvider"
import { localeForLanguage } from "../../../../lib/formatters/locale"
import { formatCurrency, formatNumber } from "../../../../lib/formatters/number"
import type { DocumentLanguage } from "../../../../pdf/PdfLanguageProvider"
import { getTemplate } from "../../../../pdf/templates"
import type { ServerCalculations } from "../../hooks/useOfferBuilder"

export type TotalsSummaryProps = {
  totals: ServerCalculations | any
  otherTaxEnabled: boolean
  currency: string
  documentLanguage: DocumentLanguage
}

/** The money block of the offer, shared by the builder and the review. */
export default function TotalsSummary({
  totals,
  otherTaxEnabled,
  currency,
  documentLanguage,
}: TotalsSummaryProps) {
  const { t, language } = useTranslation()
  const locale = localeForLanguage(language)
  const safeTotals = totals || {}

  return (
    <div className="rounded-md border border-line bg-surface p-4">
      <dl className="space-y-2 text-sm">
        <Row
          label={t("offers.builder.taxes.subtotal")}
          value={formatNumber(safeTotals.subtotal ?? 0)}
        />

        {(safeTotals.orderDiscount ?? 0) > 0 && (
          <Row
            label={`${t("offers.builder.taxes.orderDiscount")} (${safeTotals.orderDiscountPercent ?? 0}%)`}
            value={formatNumber(-(safeTotals.orderDiscount ?? 0))}
          />
        )}

        {(safeTotals.taxPercent ?? 0) > 0 && (
          <Row
            label={`${t("offers.builder.taxes.tax")} ${safeTotals.taxPercent ?? 0}%`}
            value={formatNumber(safeTotals.taxAmount ?? 0)}
          />
        )}

        {otherTaxEnabled && (safeTotals.otherTaxPercent ?? 0) > 0 && (
          <Row
            label={getTemplate(documentLanguage).otherTax}
            value={formatNumber(-(safeTotals.otherTaxAmount ?? 0))}
            emphasis="deduction"
          />
        )}

        <div className="flex items-center justify-between border-t border-line pt-2 text-base font-semibold text-primary">
          <dt>{t("offers.builder.taxes.total")}</dt>
          <dd className="tabular-nums">
            {formatCurrency(safeTotals.total ?? 0, currency, locale)}
          </dd>
        </div>
      </dl>
    </div>
  )
}

type RowProps = {
  label: string
  value: string
  emphasis?: "deduction"
}

function Row({ label, value, emphasis }: RowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd
        className={`tabular-nums ${
          emphasis === "deduction" ? "text-[#984c3f]" : "text-ink"
        }`}
      >
        {value}
      </dd>
    </div>
  )
}
