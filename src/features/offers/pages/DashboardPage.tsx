import { useMemo } from "react"
import { useNavigate } from "react-router-dom"

import Badge from "../../../components/ui/Badge"
import Button from "../../../components/ui/Button"
import DataTable, { type Column } from "../../../components/ui/DataTable"
import Icon from "../../../components/ui/Icon"
import PageHeader from "../../../app/layout/PageHeader"
import TableState from "../../../components/TableState"
import { useTranslation } from "../../../i18n/I18nProvider"
import {
  formatCompactNumber,
  formatCurrency,
  formatPercent,
} from "../../../lib/formatters"
import { localeForLanguage } from "../../../lib/formatters/locale"
import { formatIsoDay } from "../../../lib/formatters/date"
import { useSession } from "../../account/SessionProvider"
import { useOffers } from "../hooks/useOffers"
import type { OfferListItem } from "../types"

type StatCard = {
  label: string
  value: string
  note: string
}

export default function DashboardPage() {
  const { t, language } = useTranslation()
  const navigate = useNavigate()
  const { data: offersPage, loading, error } = useOffers({
    pageSize: 200,
    latestOnly: true,
    sortBy: "updatedAt",
    sortDir: "desc",
  } as any)
  const { user } = useSession()
  const locale = localeForLanguage(language)

  const getGreeting = () => {
    const hour = new Date().getHours()
    const name = user?.name ?? user?.email ?? ""
    if (hour < 12) {
      return t("dashboard.greetingMorning", { name })
    }
    if (hour < 18) {
      return t("dashboard.greetingAfternoon", { name })
    }
    return t("dashboard.greetingEvening", { name })
  }

  const offersList = offersPage?.items ?? []

  const stats = useMemo<StatCard[]>(() => {
    const safeList = offersList
    const monthKey = new Date().toISOString().slice(0, 7)
    const thisMonth = safeList.filter((offer) =>
      (offer.issueDate || "").startsWith(monthKey),
    ).length
    const totalValue = safeList.reduce(
      (sum: number, offer) => sum + (offer.total || 0),
      0,
    )
    const closed = safeList.filter(
      (offer) => offer.status === "accepted" || offer.status === "rejected",
    )
    const accepted = safeList.filter((offer) => offer.status === "accepted")
    const awaiting = safeList.filter((offer) => offer.status === "issued")

    return [
      {
        label: t("dashboard.offersThisMonth"),
        value: String(thisMonth),
        note: "",
      },
      {
        label: t("dashboard.totalValue"),
        value: formatCompactNumber(totalValue, locale),
        note: "",
      },
      {
        label: t("dashboard.acceptanceRate"),
        value: formatPercent(
          closed.length ? (accepted.length / closed.length) * 100 : 0,
          locale,
        ),
        note: closed.length > 0 ? `${accepted.length}/${closed.length}` : "",
      },
      {
        label: t("dashboard.awaitingResponse"),
        value: String(awaiting.length),
        note: t("offers.status.issued"),
      },
    ]
  }, [offersList, t, locale])

  const columns = useMemo<Column<OfferListItem>[]>(
    () => [
      {
        key: "reference",
        header: t("offers.list.reference"),
        render: (offer) => (
          <button
            type="button"
            dir="ltr"
            onClick={() => navigate(`/offers/${offer.id}`)}
            className="font-medium text-primary transition-colors hover:text-primary-hover"
          >
            {offer.reference}
          </button>
        ),
      },
      {
        key: "customer",
        header: t("offers.list.customer"),
        render: (offer) => (
          <span className="text-ink">{offer.customerName}</span>
        ),
      },
      {
        key: "issueDate",
        header: t("offers.list.issueDate"),
        render: (offer) => (
          <span className="text-muted">{formatIsoDay(offer.issueDate)}</span>
        ),
      },
      {
        key: "total",
        header: t("offers.list.total"),
        align: "end",
        render: (offer) => (
          <span className="font-medium text-ink">
            {formatCurrency(offer.total, offer.currency, locale)}
          </span>
        ),
      },
      {
        key: "status",
        header: t("common.status"),
        render: (offer) => (
          <span className="flex items-center gap-2">
            <Badge variant={offer.status}>
              {t(`offers.status.${offer.status}`)}
            </Badge>
            {offer.version && offer.version > 1 && (
              <span className="rounded bg-page px-1.5 py-0.5 text-[11px] text-muted">
                v{offer.version}
              </span>
            )}
          </span>
        ),
      },
    ],
    [t, navigate, locale],
  )

  return (
    <>
      <PageHeader
        title={getGreeting()}
        subtitle={t("dashboard.subtitle")}
        action={
          <Button
            variant="primary"
            icon={<Icon name="plus" size={16} />}
            onClick={() => navigate("/offers/new")}
          >
            {t("dashboard.createNewOffer")}
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-line bg-surface px-4 py-4"
          >
            <p className="text-xs font-medium tracking-wide text-muted uppercase">
              {stat.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-ink">{stat.value}</p>
            <p className="mt-1 text-xs text-muted">{stat.note}</p>
          </div>
        ))}
      </div>

      <section className="mt-6 rounded-lg border border-line bg-surface">
        <header className="flex items-center justify-between border-b border-line-soft px-5 py-4">
          <h2 className="text-base font-semibold text-ink">
            {t("dashboard.recentOffers")}
          </h2>
          <Button variant="ghost" size="sm" onClick={() => navigate("/offers")}>
            {t("common.seeAll")}
          </Button>
        </header>

        <TableState
          state={
            error
              ? "error"
              : loading
                ? "loading"
                : offersList.length === 0
                  ? "empty-data"
                  : "data"
          }
          errorMessage={(error as any)?.message}
          createLabel={t("offers.list.create")}
          onCreate={() => navigate("/offers/new")}
          emptyTitle={t("offers.list.empty")}
          emptyDescription={t("dashboard.subtitle")}
        >
          <DataTable
            columns={columns}
            rows={offersList.slice(0, 5)}
            rowKey={(offer) => offer.id}
            onRowClick={(offer) => navigate(`/offers/${offer.id}`)}
          />
        </TableState>
      </section>
    </>
  )
}
