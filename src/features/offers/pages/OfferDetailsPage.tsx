import { useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

import PageHeader from "../../../app/layout/PageHeader"
import Badge from "../../../components/ui/Badge"
import Button from "../../../components/ui/Button"
import Card from "../../../components/ui/Card"
import Icon from "../../../components/ui/Icon"
import { useToast } from "../../../components/ui/ToastProvider"
import { useTranslation } from "../../../i18n/I18nProvider"
import { findPaymentTerm, paymentTermConditions, paymentTermLabel } from "../paymentTerm"
import { formatDateTime, formatIsoDay } from "../../../lib/formatters/date"
import { localeForLanguage } from "../../../lib/formatters/locale"
import { formatCurrency } from "../../../lib/formatters/number"
import OfferDocumentPreview from "../../../pdf/OfferDocumentPreview"
import type { DocumentLanguage } from "../../../pdf/PdfLanguageProvider"
import { usePrintOffer } from "../../../pdf/PrintProvider"
import { usePermissions } from "../../account/hooks/usePermissions"
import { offersApi } from "../api"
import { banksForOffer } from "../bankSelection"
import DetailsSkeleton from "../components/DetailsSkeleton"
import DocumentLanguageToggle from "../components/DocumentLanguageToggle"
import OfferSummary from "../components/OfferSummary"
import StatusDialog from "../components/StatusDialog"
import VersionHistory from "../components/VersionHistory"
import { buildDocumentData, offerToDocumentSource } from "../document"
import { useOfferDetails } from "../hooks/useOfferDetails"
import { withOfferStatus } from "../optimisticStatus"
import type { OfferStatus } from "../types"

export default function OfferDetailsPage() {
  const { t, language } = useTranslation()
  const locale = localeForLanguage(language)
  const { id } = useParams()
  const navigate = useNavigate()
  const { can } = usePermissions()
  const canWrite = can("offers.write")
  const { data, loading, error, reload, refresh, mutate } = useOfferDetails(id)
  const { notify } = useToast()
  const { print } = usePrintOffer()
  const [statusOpen, setStatusOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  // The document opens in the language the offer was saved in. Switching it here only changes
  // what is shown and printed, the saved language stays as it was.
  const [languageChoice, setLanguageChoice] = useState<
    { offerId: string | undefined; language: DocumentLanguage } | undefined
  >()
  const documentLanguage: DocumentLanguage =
    languageChoice && languageChoice.offerId === id
      ? languageChoice.language
      : (data?.offer.documentLanguage ?? "en")

  const viewOffer = useMemo(() => {
    if (!data) return undefined

    const term = findPaymentTerm(data.paymentTerms, data.offer.paymentTermId)
    const savedText = (data.offer.paymentTermsText ?? "").trim()
    const savedDefault = paymentTermConditions(term, data.offer.documentLanguage)

    return {
      term,
      offer: {
        ...data.offer,
        paymentTermsText:
          savedText !== "" && savedText === savedDefault
            ? paymentTermConditions(term, documentLanguage)
            : data.offer.paymentTermsText,
      },
    }
  }, [data, documentLanguage])

  const documentData = useMemo(() => {
    if (!data || !viewOffer) return undefined

    return buildDocumentData(offerToDocumentSource(viewOffer.offer), {
      customer: data.customer,
      company: data.company,
      banks: banksForOffer(data.banks, data.offer.bankAccountIds),
      packageTypes: data.packageTypes,
      language: documentLanguage,
      paymentTermLabel: paymentTermLabel(viewOffer.term, documentLanguage),
    })
  }, [data, documentLanguage, viewOffer])

  const changeStatus = async (status: OfferStatus) => {
    if (!data) return

    // Optimistic: show the new status and close the dialog at once, roll back on failure.
    const rollback = mutate((current) => withOfferStatus(current, status))
    setStatusOpen(false)
    setSaving(true)
    try {
      await offersApi.setStatus(data.offer.id, status)
      refresh()
    } catch (cause) {
      rollback()
      notify(
        cause instanceof Error ? cause.message : t("common.somethingWrong"),
        "error",
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <PageHeader title={t("offers.details.title")} />
        <DetailsSkeleton />
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
  const versionCount = versions?.length ?? (offer.version > 0 ? 1 : 0)

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
            {versionCount > 1 && (
              <span className="rounded bg-page px-2 py-1 text-xs text-muted">
                {t("offers.details.versionCount", { count: versionCount })}
              </span>
            )}

            <Button
              variant="secondary"
              icon={<Icon name="print" size={16} />}
              onClick={() =>
                documentData &&
                print({ data: documentData, language: documentLanguage })
              }
            >
              {t("common.print")}
            </Button>

            {canWrite && (
              <>
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
              </>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_26rem]">
        <div className="min-w-0 space-y-4">
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

            <dl
              aria-label={t("offers.list.createdBy")}
              className="mb-4 grid gap-3 rounded-md border border-line-soft bg-page/50 p-4 text-sm sm:grid-cols-2"
            >
              <div>
                <dt className="text-xs text-muted">
                  {t("offers.details.createdBy")}
                </dt>
                <dd className="font-medium text-ink">
                  {offer.createdByName || t("offers.list.unknownUser")}
                </dd>
                <dd dir="ltr" className="text-start text-xs text-muted tabular-nums">
                  {t("offers.details.createdAt")} {formatDateTime(offer.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">
                  {t("offers.details.lastModifiedBy")}
                </dt>
                <dd className="font-medium text-ink">
                  {offer.updatedByName || t("offers.list.unknownUser")}
                </dd>
                <dd dir="ltr" className="text-start text-xs text-muted tabular-nums">
                  {t("offers.details.lastModifiedAt")}{" "}
                  {offer.updatedAt ? formatDateTime(offer.updatedAt) : "—"}
                </dd>
              </div>
            </dl>

            <OfferSummary offer={viewOffer?.offer ?? offer} />
          </Card>

          <Card title={t("offers.details.versions")}>
            <VersionHistory versions={versions} currentId={offer.id} />
          </Card>
        </div>

        <aside className="lg:sticky lg:top-20">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-ink">
              {t("offers.builder.preview.title")}
            </h2>
            <DocumentLanguageToggle
              language={documentLanguage}
              onChange={(next) =>
                setLanguageChoice({ offerId: id, language: next })
              }
            />
          </div>
          <div className="max-h-[calc(100vh-8rem)] overflow-auto rounded-md border border-line p-3">
            {documentData && (
              <OfferDocumentPreview
                data={documentData}
                language={documentLanguage}
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
