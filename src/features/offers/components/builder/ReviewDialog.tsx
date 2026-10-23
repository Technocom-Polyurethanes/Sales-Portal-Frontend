import Button from "../../../../components/ui/Button"
import Dialog from "../../../../components/ui/Dialog"
import { useTranslation } from "../../../../i18n/I18nProvider"
import type { Totals } from "../../../../lib/calculations/tax"
import { formatIsoDay } from "../../../../lib/formatters/date"
import { formatNumber } from "../../../../lib/formatters/number"
import type { DocumentLanguage } from "../../../../pdf/PdfLanguageProvider"
import TotalsSummary from "./TotalsSummary"

export type ReviewDialogProps = {
  open: boolean
  reference: string
  customerName: string
  issueDate: string
  dueDate: string
  totals: Totals
  otherTaxEnabled: boolean
  currency: string
  documentLanguage: DocumentLanguage
  saving: boolean
  onConfirm: () => void
  onClose: () => void
}

/** Confirmation shown before an offer is issued. */
export default function ReviewDialog({
  open,
  reference,
  customerName,
  issueDate,
  dueDate,
  totals,
  otherTaxEnabled,
  currency,
  documentLanguage,
  saving,
  onConfirm,
  onClose,
}: ReviewDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog
      open={open}
      title={t("offers.builder.review.title")}
      onClose={onClose}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" onClick={onConfirm} loading={saving}>
            {t("offers.builder.saveIssue")}
          </Button>
        </>
      }
    >
      <p className="mb-4 text-muted">{t("offers.builder.review.hint")}</p>

      <dl className="mb-4 grid gap-3 rounded-md border border-line-soft bg-page/50 p-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted">
            {t("offers.builder.review.reference")}
          </dt>
          <dd dir="ltr" className="font-semibold text-primary">
            {reference}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">
            {t("offers.builder.review.customer")}
          </dt>
          <dd className="font-medium text-ink">{customerName}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">
            {t("offers.builder.review.issueDate")}
          </dt>
          <dd className="text-ink">{formatIsoDay(issueDate)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">
            {t("offers.builder.review.dueDate")}
          </dt>
          <dd className="text-ink">{formatIsoDay(dueDate)}</dd>
        </div>
      </dl>

      <TotalsSummary
        totals={totals}
        otherTaxEnabled={otherTaxEnabled}
        currency={currency}
        documentLanguage={documentLanguage}
      />

      <p className="mt-3 text-xs text-muted">
        {t("offers.builder.review.bankNote", {
          total: formatNumber(totals.total),
          currency,
        })}
      </p>
    </Dialog>
  )
}
