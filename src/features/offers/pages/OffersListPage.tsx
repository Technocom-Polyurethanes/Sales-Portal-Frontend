import { useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"

import Badge from "../../../components/ui/Badge"
import Button from "../../../components/ui/Button"
import DataTable, { type Column } from "../../../components/ui/DataTable"
import EmptyState from "../../../components/ui/EmptyState"
import Icon from "../../../components/ui/Icon"
import Spinner from "../../../components/ui/Spinner"
import PageHeader from "../../../app/layout/PageHeader"
import TableState from "../../../components/TableState"
import { useTranslation } from "../../../i18n/I18nProvider"
import { formatCurrency } from "../../../lib/formatters"
import { localeForLanguage } from "../../../lib/formatters/locale"
import { formatIsoDay } from "../../../lib/formatters/date"
import { useOffers } from "../hooks/useOffers"
import type { Offer, OfferStatus } from "../types"

const STATUS_FILTERS: (OfferStatus | "all")[] = [
  "all",
  "draft",
  "issued",
  "accepted",
  "rejected",
]

export default function OffersListPage() {
  const { t, language } = useTranslation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [status, setStatus] = useState<OfferStatus | "all">("all")

  const search = searchParams.get("search") ?? ""
  const { data: offers, loading } = useOffers({ status, search })
  const locale = localeForLanguage(language)

  const columns = useMemo<Column<Offer>[]>(
    () => [
      {
        key: "reference",
        header: t("offers.list.reference"),
        render: (offer) => (
          <span className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(`/offers/${offer.id}`)}
              dir="ltr"
              className="font-medium text-primary transition-colors hover:text-primary-hover"
            >
              {offer.reference}
            </button>
            {offer.version > 1 && (
              <span className="rounded bg-page px-1.5 py-0.5 text-[11px] text-muted">
                v{offer.version}
              </span>
            )}
          </span>
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
      {
        key: "actions",
        header: "",
        align: "end",
        render: (offer) => (
          <button
            type="button"
            onClick={() => navigate(`/offers/${offer.id}`)}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary-hover"
          >
            {t("offers.list.open")}
            <Icon name="chevron" size={15} />
          </button>
        ),
      },
    ],
    [t, navigate, locale],
  )

  const setSearch = (value: string) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set("search", value)
    else next.delete("search")
    setSearchParams(next, { replace: true })
  }

  const offersList = offers ?? []
  const hasActiveFilters = search.trim() !== "" || status !== "all"
  const tableState = loading
    ? "loading"
    : offersList.length === 0 && hasActiveFilters
      ? "empty-results"
      : offersList.length === 0
        ? "empty-data"
        : "data"

  return (
    <>
      <PageHeader
        title={t("offers.list.title")}
        subtitle={t("offers.list.subtitle")}
        action={
          <Button
            variant="primary"
            icon={<Icon name="plus" size={18} />}
            onClick={() => navigate("/offers/new")}
          >
            {t("offers.list.create")}
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setStatus(option)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              status === option
                ? "border-primary bg-primary-soft text-primary"
                : "border-line bg-surface text-muted hover:text-ink"
            }`}
          >
            {t(`offers.status.${option}`)}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-line bg-surface">
        <TableState
          state={tableState}
          query={search}
          onClearSearch={() => setSearch("")}
          onClearFilters={() => setStatus("all")}
          createLabel={t("offers.list.create")}
          onCreate={() => navigate("/offers/new")}
          emptyTitle={t("offers.list.empty")}
          emptyDescription={t("offers.list.subtitle")}
        >
          <DataTable
            columns={columns}
            rows={offersList}
            rowKey={(offer) => offer.id}
            onRowClick={(offer) => navigate(`/offers/${offer.id}`)}
          />
        </TableState>

        {!loading && offersList.length > 0 && (
          <div className="flex items-center justify-between border-t border-line px-4 py-3 text-xs text-muted">
            <span>{t("offers.list.count", { count: offersList.length })}</span>
            <span>{t("common.page", { page: 1, pages: 1 })}</span>
          </div>
        )}
      </div>
    </>
  )
}
