import { useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

import PageHeader from "../../../app/layout/PageHeader"
import PagedTable from "../../../components/PagedTable"
import Badge from "../../../components/ui/Badge"
import Button from "../../../components/ui/Button"
import type { Column } from "../../../components/ui/DataTable"
import Icon from "../../../components/ui/Icon"
import TableSkeleton from "../../../components/ui/TableSkeleton"
import { useTranslation } from "../../../i18n/I18nProvider"
import { formatIsoDay } from "../../../lib/formatters/date"
import { localeForLanguage } from "../../../lib/formatters/locale"
import { formatCurrency } from "../../../lib/formatters/number"
import { useAsyncData } from "../../../lib/hooks/useAsyncData"
import type { OfferListItem } from "../../offers/types"
import { customersApi } from "../api"

export default function CustomerHistoryPage() {
  const { t, language } = useTranslation()
  const navigate = useNavigate()
  const { id = "" } = useParams()
  const [page, setPage] = useState(1)
  const {
    data: customer,
    loading,
    error,
  } = useAsyncData(() => customersApi.get(id), [id])
  const {
    data: offers,
    loading: offersLoading,
    error: offersError,
    reload: reloadOffers,
  } = useAsyncData(() => customersApi.offersPage(id, page), [id, page])

  const locale = localeForLanguage(language)
  const columns = useMemo<Column<OfferListItem>[]>(
    () => [
      {
        key: "reference",
        header: t("offers.list.reference"),
        render: (offer) => (
          <span dir="ltr" className="font-medium text-primary">
            {offer.reference}
          </span>
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
          <Badge variant={offer.status}>
            {t(`offers.status.${offer.status}`)}
          </Badge>
        ),
      },
    ],
    [t, locale],
  )

  if (loading) {
    return (
      <>
        <PageHeader title={t("customers.title")} />
        <TableSkeleton rows={3} columns={4} />
      </>
    )
  }

  if (error || !customer) {
    return (
      <>
        <PageHeader title={t("customers.title")} />
        <div className="rounded-lg border border-line bg-surface px-5 py-10 text-center">
          <p className="text-sm text-muted">{t("customers.notFound")}</p>
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => navigate("/customers")}
          >
            {t("customers.backToCustomers")}
          </Button>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        eyebrow={t("customers.title")}
        title={customer.name}
        subtitle={customer.customerCode ?? customer.code}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={() => navigate("/customers")}>
              {t("customers.backToCustomers")}
            </Button>
            <Button
              variant="primary"
              icon={<Icon name="plus" size={18} />}
              onClick={() => navigate("/offers/new")}
            >
              {t("customers.newOffer")}
            </Button>
          </div>
        }
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-line bg-surface p-4">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">
            {t("customers.offers")}
          </p>
          <p className="mt-1 text-2xl font-semibold text-ink">
            {customer.offersCount ?? 0}
          </p>
        </div>
        <div className="rounded-lg border border-line bg-surface p-4">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">
            {t("customers.totalValue")}
          </p>
          <p className="mt-1 text-2xl font-semibold text-ink">
            {formatCurrency(customer.totalValue ?? 0, "EGP", locale)}
          </p>
        </div>
        <div className="rounded-lg border border-line bg-surface p-4">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">
            {t("customers.lastOffer")}
          </p>
          <p className="mt-1 text-2xl font-semibold text-ink">
            {customer.lastOfferDate
              ? formatIsoDay(customer.lastOfferDate)
              : "—"}
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-lg border border-line bg-surface p-4 text-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <Detail
            label={t("customers.contact")}
            value={customer.contactPerson}
          />
          <Detail label={t("customers.email")} value={customer.email} />
          <Detail label={t("customers.phone")} value={customer.phone} />
          <Detail label={t("customers.city")} value={customer.city} />
          <div className="sm:col-span-2">
            <Detail label={t("customers.address")} value={customer.address} />
          </div>
        </div>
      </div>

      <h2 className="mb-3 text-sm font-semibold text-ink">
        {t("customers.history")}
      </h2>
      <PagedTable
        data={offers}
        loading={offersLoading}
        error={offersError}
        columns={columns}
        rowKey={(offer) => offer.id}
        onRowClick={(offer) => navigate(`/offers/${offer.id}`)}
        onPageChange={setPage}
        onRetry={reloadOffers}
        emptyTitle={t("customers.noHistory")}
        skeletonColumns={4}
      />
    </>
  )
}

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-0.5 text-ink">{value || "—"}</p>
    </div>
  )
}
