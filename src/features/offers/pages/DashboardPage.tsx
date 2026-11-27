import type { ReactNode } from "react"
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
  "lg:grid lg:grid-cols-[minmax(0,1.7fr)_minmax(0,0.8fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,0.8fr)] lg:items-center lg:gap-4"

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

function DashboardMeta({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <span className="min-w-0">
      <span className="block text-xs font-semibold text-muted">{label}</span>
      <span className="mt-0.5 block truncate text-sm text-ink">{children}</span>
    </span>
  )
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
  const thisMonth = (doc: DashboardDocument) => doc.issueDate.startsWith(monthKey)
  const accepted = documents.filter(
    (doc) => doc.status === "accepted" && thisMonth(doc),
  ).length
  const closed = documents.filter(
    (doc) => doc.status === "accepted" || doc.status === "rejected",
  ).length
  const acceptedTotal = documents.filter((doc) => doc.status === "accepted").length
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

      <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-line-soft bg-line-soft sm:grid-cols-3">
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
        <header className="mb-3 flex flex-wrap items-center justify-between gap-3">
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
          className={`hidden border-b border-line-soft bg-surface px-5 py-2 text-xs font-semibold text-muted lg:grid ${DOCUMENT_COLUMNS}`}
        >
          <span>{t("dashboard.document")}</span>
          <span>{t("dashboard.type")}</span>
          <span>{t("common.status")}</span>
          <span className="text-end">{t("common.total")}</span>
          <span className="text-end">{t("common.date")}</span>
        </div>

        {error ? (
          <div
            role="alert"
            className="rounded-lg border border-line-soft bg-surface px-4 py-10 text-center"
          >
            <p className="text-sm text-ink">{t("dashboard.loadFailed")}</p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={reload}
            >
              {t("common.retry")}
            </Button>
          </div>
        ) : loading ? (
          <ul
            aria-busy="true"
            className="divide-y divide-line-soft overflow-hidden rounded-lg border border-line-soft bg-surface"
          >
            {Array.from({ length: RECENT_COUNT }, (_, index) => (
              <li key={index} className={`px-4 py-3 sm:px-5 ${DOCUMENT_COLUMNS}`}>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-2.5 w-1/2" />
                </div>
                <Skeleton className="hidden h-3 w-16 lg:block" />
                <Skeleton className="hidden h-6 w-16 rounded-full lg:block" />
                <Skeleton className="hidden h-3 w-24 justify-self-end lg:block" />
                <Skeleton className="hidden h-3 w-16 justify-self-end lg:block" />
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:hidden">
                  <Skeleton className="h-8" />
                  <Skeleton className="h-8" />
                  <Skeleton className="h-8" />
                </div>
              </li>
            ))}
          </ul>
        ) : documents.length === 0 ? (
          <div
            role="status"
            className="rounded-lg border border-line-soft bg-surface px-4 py-10 text-center"
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
          <ul className="divide-y divide-line-soft overflow-hidden rounded-lg border border-line-soft bg-surface">
            {documents.slice(0, RECENT_COUNT).map((doc) => (
              <li key={doc.id} className="px-4 py-3 sm:px-5">
                <button
                  type="button"
                  aria-label={`${doc.reference}, ${documentType(doc)}, ${doc.customer}, ${t(`offers.status.${doc.status}`)}`}
                  onClick={() => navigate(`/offers/${doc.id}`)}
                  className={`w-full rounded-lg text-start transition-colors hover:bg-page focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${DOCUMENT_COLUMNS}`}
                >
                  <span className="flex min-w-0 items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block truncate text-start text-sm font-semibold text-ink">
                        <bdi dir="ltr">{doc.reference}</bdi>
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted">
                        {doc.customer}
                      </span>
                    </span>
                    <span className="shrink-0 lg:hidden">
                      <Badge variant={doc.status}>
                        {t(`offers.status.${doc.status}`)}
                      </Badge>
                    </span>
                  </span>

                  <span className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:hidden">
                    <DashboardMeta label={t("dashboard.type")}>
                      {documentType(doc)}
                    </DashboardMeta>
                    <DashboardMeta label={t("common.total")}>
                      {formatCurrency(doc.total, doc.currency, locale)}
                    </DashboardMeta>
                    <DashboardMeta label={t("common.date")}>
                      <span dir="ltr">
                        {formatIsoDay(doc.issueDate, locale)}
                      </span>
                    </DashboardMeta>
                  </span>

                  <span className="hidden min-w-0 truncate text-sm text-muted lg:block">
                    {documentType(doc)}
                  </span>
                  <span className="hidden lg:block">
                    <Badge variant={doc.status}>
                      {t(`offers.status.${doc.status}`)}
                    </Badge>
                  </span>
                  <span className="hidden truncate text-sm font-medium text-ink lg:block lg:text-end">
                    {formatCurrency(doc.total, doc.currency, locale)}
                  </span>
                  <span className="hidden text-xs text-muted lg:block lg:text-end">
                    <bdi dir="ltr">{formatIsoDay(doc.issueDate, locale)}</bdi>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
