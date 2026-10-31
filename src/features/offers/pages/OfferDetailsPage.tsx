import { useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

import PageHeader from "../../../app/layout/PageHeader"
import Badge from "../../../components/ui/Badge"
import Button from "../../../components/ui/Button"
import Card from "../../../components/ui/Card"
import Icon from "../../../components/ui/Icon"
import Spinner from "../../../components/ui/Spinner"
import { useTranslation } from "../../../i18n/I18nProvider"
import { getPaymentTerm } from "../../../lib/calculations/dueDate"
import { formatIsoDay } from "../../../lib/formatters/date"
import { localeForLanguage } from "../../../lib/formatters/locale"
import { formatCurrency } from "../../../lib/formatters/number"
import OfferDocumentPreview from "../../../pdf/OfferDocumentPreview"
import { usePrintOffer } from "../../../pdf/PrintProvider"
import { offersApi } from "../api"
import OfferSummary from "../components/OfferSummary"
import StatusDialog from "../components/StatusDialog"
import VersionHistory from "../components/VersionHistory"
import { buildDocumentData, offerToDocumentSource } from "../document"
import { useOfferDetails } from "../hooks/useOfferDetails"
import type { OfferStatus } from "../types"

export default function OfferDetailsPage() {
  const { t, language } = useTranslation()
  const locale = localeForLanguage(language)
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, loading, error, reload } = useOfferDetails(id)
  const { print } = usePrintOffer()
  const [statusOpen, setStatusOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const documentData = useMemo(() => {
    if (!data) return undefined

    const term = getPaymentTerm(data.offer.paymentTermId)
    const language = data.offer.documentLanguage

    return buildDocumentData(offerToDocumentSource(data.offer), {
      customer: data.customer,
      company: data.company,
      banks: data.banks,
      packageTypes: data.packageTypes,
      language,
      paymentTermLabel: language === "ar" ? term.labelAr : term.label,
    })
  }, [data])

  const changeStatus = async (status: OfferStatus) => {
    if (!data) return

    setSaving(true)
    try {
      await offersApi.setStatus(data.offer.id, status)
      setStatusOpen(false)
      reload()
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <PageHeader title={t("offers.details.title")} />
        <div className="flex justify-center py-20">
          <Spinner size={26} />
        </div>
      </>
    )
  }

  if (error || !data) {
    return (
      <>
        <PageHeader title={t("offers.details.title")} />
        <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {t("offers.details.notFound")}
        </p>
      </>
    )
  }

  const { offer, versions, customer } = data

  return (
    <>
      <PageHeader
        title={offer.reference}
        subtitle={customer?.name ?? offer.customerName}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={offer.status}>
              {t(`offers.status.${offer.status}`)}
            </Badge>
            {offer.version > 1 && (
              <span className="rounded bg-page px-2 py-1 text-xs text-muted">
                v{offer.version}
              </span>
            )}

            <Button
              variant="secondary"
              icon={<Icon name="print" size={16} />}
              onClick={() =>
                documentData &&
                print({ data: documentData, language: offer.documentLanguage })
              }
            >
              {t("common.print")}
            </Button>

            <Button
              variant="secondary"
              icon={<Icon name="copy" size={16} />}
              onClick={() =>
                navigate(`/offers/new?from=${offer.id}&duplicate=1`)
              }
            >
              {t("offers.details.duplicate")}
            </Button>

            <Button
              variant="secondary"
              icon={<Icon name="edit" size={16} />}
              onClick={() => navigate(`/offers/new?from=${offer.id}`)}
            >
              {t("offers.details.newVersion")}
            </Button>

            <Button
              variant="primary"
              icon={<Icon name="check" size={16} />}
              onClick={() => setStatusOpen(true)}
            >
              {t("offers.details.changeStatus")}
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_26rem]">
        <div className="space-y-4">
          <Card title={t("offers.details.summary")}>
            <dl className="mb-4 grid gap-3 rounded-md border border-line-soft bg-page/50 p-4 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-xs text-muted">
                  {t("offers.list.issueDate")}
                </dt>
                <dd className="font-medium text-ink">
                  {formatIsoDay(offer.issueDate)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">
                  {t("offers.builder.basics.dueDate")}
                </dt>
                <dd className="font-medium text-ink">
                  {formatIsoDay(offer.dueDate)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">
                  {t("offers.builder.basics.customer")}
                </dt>
                <dd className="truncate font-medium text-ink">
                  {customer?.name ?? offer.customerName}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">{t("common.total")}</dt>
                <dd className="font-semibold text-primary tabular-nums">
                  {formatCurrency(offer.totals?.total ?? (offer as any).total ?? 0, offer.currency, locale)}
                </dd>
              </div>
            </dl>

            <OfferSummary offer={offer} />
          </Card>

          <Card title={t("offers.details.versions")}>
            <VersionHistory versions={versions} currentId={offer.id} />
          </Card>
        </div>

        <aside className="lg:sticky lg:top-20">
          <h2 className="mb-2 text-sm font-semibold text-ink">
            {t("offers.builder.preview.title")}
          </h2>
          <div className="max-h-[calc(100vh-8rem)] overflow-auto rounded-md border border-line p-3">
            {documentData && (
              <OfferDocumentPreview
                data={documentData}
                language={offer.documentLanguage}
              />
            )}
          </div>
        </aside>
      </div>

      <StatusDialog
        open={statusOpen}
        status={offer.status}
        saving={saving}
        onSelect={(status) => void changeStatus(status)}
        onClose={() => setStatusOpen(false)}
      />
    </>
  )
}
