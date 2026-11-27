import { useNavigate } from "react-router-dom"

import PageHeader from "../../../app/layout/PageHeader"
import Badge from "../../../components/ui/Badge"
import Button from "../../../components/ui/Button"
import Icon from "../../../components/ui/Icon"
import Skeleton from "../../../components/ui/Skeleton"
import { useTranslation } from "../../../i18n/I18nProvider"
import {
  formatCurrency,
  formatIsoDay,
  formatPercent,
} from "../../../lib/formatters"
import { localeForLanguage } from "../../../lib/formatters/locale"
import { usePermissions } from "../../account/hooks/usePermissions"
import { useSession } from "../../account/SessionProvider"
import { useOffers } from "../hooks/useOffers"
import type { OfferListItem } from "../types"

const RECENT_COUNT = 6
const DOCUMENT_COLUMNS =
  "grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.9fr)_minmax(0,0.8fr)] sm:items-center sm:gap-4"

type DocumentKind = "offer" | "purchaseOrder"

type DashboardDocument = {
  id: string
  reference: string
  customer: string
  kind: DocumentKind
  status: OfferListItem["status"]
  total: number
  currency: string
  issueDate: string
}

export default function DashboardPage() {
  const { t, language } = useTranslation()
  const navigate = useNavigate()
  const { can } = usePermissions()
  const canWriteOffers = can("offers.write")
  const { user } = useSession()
  const locale = localeForLanguage(language)
  const {
    data: offersPage,
    loading,
    error,
    reload,
  } = useOffers({
    pageSize: 200,
    latestOnly: true,
    sortBy: "updatedAt",
    sortDir: "desc",
  })

  const documents: DashboardDocument[] = (offersPage?.items ?? []).map(
    (offer) => ({
      id: offer.id,
      reference: offer.reference,
      customer: offer.customerName,
      kind: "offer",
      status: offer.status,
      total: offer.total,
      currency: offer.currency,
      issueDate: offer.issueDate,
    }),
  )
  const monthKey = new Date().toISOString().slice(0, 7)
  const thisMonth = (doc: DashboardDocument) =>
    doc.issueDate.startsWith(monthKey)
  const accepted = documents.filter(
    (doc) => doc.status === "accepted" && thisMonth(doc),
  ).length
  const closed = documents.filter(
    (doc) => doc.status === "accepted" || doc.status === "rejected",
  ).length
  const acceptedTotal = documents.filter(
    (doc) => doc.status === "accepted",
  ).length
  const stats = [
    {
      label: t("dashboard.documentsThisMonth"),
      value: String(documents.filter(thisMonth).length),
    },
    { label: t("dashboard.acceptedThisMonth"), value: String(accepted) },
    {
      label: t("dashboard.acceptanceRate"),
      value: formatPercent(closed ? (acceptedTotal / closed) * 100 : 0, locale),
    },
  ]

  const documentType = (doc: DashboardDocument) =>
    t(doc.kind === "offer" ? "dashboard.offer" : "dashboard.purchaseOrder")

  const hour = new Date().getHours()
  const title = t(
    hour < 12
      ? "dashboard.greetingMorning"
      : hour < 18
        ? "dashboard.greetingAfternoon"
        : "dashboard.greetingEvening",
    { name: user?.name ?? user?.email ?? "" },
  )

  return (
    <>
      <PageHeader
        title={title}
        subtitle={t("dashboard.subtitle")}
        action={
          canWriteOffers ? (
            <Button
              variant="primary"
              icon={<Icon name="plus" size={16} />}
              onClick={() => navigate("/offers/new")}
            >
              {t("dashboard.createNewOffer")}
            </Button>
          ) : undefined
        }
      />

      <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-surface px-4 py-4">
            <dt className="text-xs text-muted">{stat.label}</dt>
            <dd className="mt-1 text-2xl font-semibold tracking-tight text-ink">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>

      <section className="mt-6" aria-labelledby="dashboard-documents">
        <header className="mb-3 flex items-center justify-between gap-3">
          <h2
            id="dashboard-documents"
            className="text-base font-semibold text-ink"
          >
            {t("dashboard.recentDocuments")}
          </h2>
          <Button variant="ghost" size="sm" onClick={() => navigate("/offers")}>
            {t("common.seeAll")}
          </Button>
        </header>

        <div
          aria-hidden="true"
          className={`hidden border-b border-line bg-surface px-4 py-2 text-xs font-semibold tracking-wide text-muted uppercase sm:grid ${DOCUMENT_COLUMNS}`}
        >
          <span>{t("dashboard.document")}</span><span>{t("dashboard.type")}</span><span>{t("common.status")}</span><span className="text-end">{t("common.total")}</span><span className="text-end">{t("common.date")}</span>
        </div>


        {error ? (
          <div
            role="alert"
            className="rounded-lg border border-line bg-surface px-4 py-10 text-center"
          >
            <p className="text-sm text-ink">{t("dashboard.loadFailed")}</p>
            <Button variant="secondary" size="sm" className="mt-3" onClick={reload}>{t("common.retry")}</Button>
          </div>
        ) : loading ? (
          <ul
            aria-busy="true"
            className="divide-y divide-line-soft overflow-hidden rounded-lg border border-line bg-surface"
          >
            {Array.from({ length: RECENT_COUNT }, (_, index) => (
              <li key={index} className={`px-4 py-3 ${DOCUMENT_COLUMNS}`}>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-2.5 w-1/2" />
                </div>
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-3 w-24 justify-self-end" />
                <Skeleton className="h-3 w-16 justify-self-end" />
              </li>
            ))}
          </ul>
        ) : documents.length === 0 ? (
          <div
            role="status"
            className="rounded-lg border border-line bg-surface px-4 py-10 text-center"
          >
            <Icon name="offers" size={28} className="mx-auto text-muted" />
            <p className="mt-3 text-sm font-medium text-ink">
              {t("dashboard.emptyDocuments")}
            </p>
            <p className="mt-1 text-xs text-muted">
              {t("dashboard.emptyDocumentsHint")}
            </p>
            {canWriteOffers && (
              <Button
                variant="primary"
                size="sm"
                className="mt-4"
                onClick={() => navigate("/offers/new")}
              >
                {t("dashboard.createNewOffer")}
              </Button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-line-soft overflow-hidden rounded-lg border border-line bg-surface">
            {documents.slice(0, RECENT_COUNT).map((doc) => (
              <li key={doc.id}>
                <button
                  type="button"
                  aria-label={`${doc.reference}, ${documentType(doc)}, ${doc.customer}, ${t(`offers.status.${doc.status}`)}`}
                  onClick={() => navigate(`/offers/${doc.id}`)}
                  className={`w-full px-4 py-3 text-start transition-colors hover:bg-page focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${DOCUMENT_COLUMNS}`}
                >
                  <span className="min-w-0">
                    <span
                      dir="ltr"
                      className="block truncate text-start text-sm font-medium text-ink"
                    >
                      {doc.reference}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted">
                      {doc.customer}
                    </span>
                  </span>
                  <span className="text-xs text-muted sm:text-sm sm:text-ink">
                    {documentType(doc)}
                  </span>
                  <span>
                    <Badge variant={doc.status}>
                      {t(`offers.status.${doc.status}`)}
                    </Badge>
                  </span>
                  <span className="text-sm font-medium text-ink sm:text-end">
                    {formatCurrency(doc.total, doc.currency, locale)}
                  </span>
                  <span dir="ltr" className="text-xs text-muted sm:text-end">{formatIsoDay(doc.issueDate, locale)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
