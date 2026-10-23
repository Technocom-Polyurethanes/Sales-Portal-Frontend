import { useMemo } from "react"
import { useNavigate } from "react-router-dom"

import Badge from "../../../components/ui/Badge"
import Button from "../../../components/ui/Button"
import DataTable, { type Column } from "../../../components/ui/DataTable"
import Icon from "../../../components/ui/Icon"
import Spinner from "../../../components/ui/Spinner"
import PageHeader from "../../../app/layout/PageHeader"
import { useTranslation } from "../../../i18n/I18nProvider"
import {
  formatCompactNumber,
  formatCurrency,
  formatPercent,
} from "../../../lib/formatters"
import { localeForLanguage } from "../../../lib/formatters/locale"
import { formatIsoDay } from "../../../lib/formatters/date"
import { useOffers } from "../hooks/useOffers"
import type { Offer } from "../types"

type StatCard = {
  label: string
  value: string
  note: string
}

export default function DashboardPage() {
  const { t, language } = useTranslation()
  const navigate = useNavigate()
  const { data: offers, loading } = useOffers()
  const locale = localeForLanguage(language)

  const stats = useMemo<StatCard[]>(() => {
    const list = offers ?? []
    const monthKey = list[0]?.issueDate.slice(0, 7)
    const thisMonth = list.filter((offer) =>
      offer.issueDate.startsWith(monthKey ?? ""),
    ).length
    const totalValue = list
      .filter(
        (offer) => offer.status === "issued" || offer.status === "accepted",
      )
      .reduce((sum, offer) => sum + offer.totals.total, 0)
    const closed = list.filter(
      (offer) => offer.status === "accepted" || offer.status === "rejected",
    )
    const accepted = list.filter((offer) => offer.status === "accepted")
    const awaiting = list.filter((offer) => offer.status === "issued")

    return [
      {
        label: t("dashboard.offersThisMonth"),
        value: String(thisMonth),
        note: t("dashboard.moreThanLastMonth", { count: 6 }),
      },
      {
        label: t("dashboard.totalValue"),
        value: formatCompactNumber(totalValue, locale),
        note: "EGP",
      },
      {
        label: t("dashboard.acceptanceRate"),
        value: formatPercent(
          closed.length ? (accepted.length / closed.length) * 100 : 0,
          locale,
        ),
        note: t("dashboard.awaitingResponse"),
      },
      {
        label: t("dashboard.awaitingResponse"),
        value: String(awaiting.length),
        note: t("offers.status.issued"),
      },
    ]
  }, [offers, t, locale])

  const columns = useMemo<Column<Offer>[]>(
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
            {formatCurrency(offer.totals.total, offer.currency, locale)}
          </span>
        ),
      },
      {
        key: "status",
        header: t("common.status"),
        render: (offer) => (
          <Badge variant={offer.status}>
            {t(`offers.status.${offer.status}`)}
          </Badge>
        ),
      },
    ],
    [t, navigate, locale],
  )

  return (
    <>
      <PageHeader
        title={t("dashboard.greeting")}
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

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size={26} />
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={(offers ?? []).slice(0, 5)}
            rowKey={(offer) => offer.id}
            onRowClick={(offer) => navigate(`/offers/${offer.id}`)}
          />
        )}
      </section>
    </>
  )
}
