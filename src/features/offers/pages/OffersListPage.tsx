import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"

import Button from "../../../components/ui/Button"
import Icon from "../../../components/ui/Icon"
import PageHeader from "../../../app/layout/PageHeader"
import PagedCards from "../../../components/PagedCards"
import { useTranslation } from "../../../i18n/I18nProvider"
import { usePermissions } from "../../account/hooks/usePermissions"
import OfferCard from "../components/OfferCard"
import { useOffers } from "../hooks/useOffers"
import type { OfferStatus } from "../types"

/** Twelve cards fill whole rows of the one, two and three column grid. */
const OFFERS_PAGE_SIZE = 12

const STATUS_FILTERS: (OfferStatus | "all")[] = [
  "all",
  "draft",
  "issued",
  "accepted",
  "rejected",
]

export default function OffersListPage() {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const canWrite = can("offers.write")
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const statusParam = searchParams.get("status") as OfferStatus | null
  const initialStatus =
    statusParam && STATUS_FILTERS.includes(statusParam) ? statusParam : "all"
  const [status, setStatus] = useState<OfferStatus | "all">(initialStatus)

  useEffect(() => {
    const sp = searchParams.get("status") as OfferStatus | null
    if (sp && STATUS_FILTERS.includes(sp)) {
      if (sp !== status) setStatus(sp)
    } else if (!sp && status !== "all") {
      setStatus("all")
    }
  }, [searchParams, status])

  const handleStatusChange = (value: OfferStatus | "all") => {
    setStatus(value)
    const next = new URLSearchParams(searchParams)
    if (value === "all") next.delete("status")
    else next.set("status", value)
    setSearchParams(next, { replace: true })
  }

  const search = searchParams.get("search") ?? ""
  const [page, setPage] = useState(1)
  const { data, loading, error, reload } = useOffers({
    status,
    search,
    page,
    pageSize: OFFERS_PAGE_SIZE,
  })

  // A new filter or search starts again from the first page.
  useEffect(() => {
    setPage(1)
  }, [status, search])

  const setSearch = (value: string) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set("search", value)
    else next.delete("search")
    setSearchParams(next, { replace: true })
  }

  const hasActiveFilters = search.trim() !== "" || status !== "all"

  return (
    <>
      <PageHeader
        title={t("offers.list.title")}
        subtitle={t("offers.list.subtitle")}
        action={
          canWrite ? (
            <Button
              variant="primary"
              icon={<Icon name="plus" size={18} />}
              onClick={() => navigate("/offers/new")}
            >
              {t("offers.list.create")}
            </Button>
          ) : undefined
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => handleStatusChange(option)}
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

      <PagedCards
        data={data}
        loading={loading}
        error={error}
        rowKey={(offer) => offer.id}
        renderCard={(offer) => (
          <OfferCard
            offer={offer}
            onOpen={(item) => navigate(`/offers/${item.id}`)}
          />
        )}
        onPageChange={setPage}
        onRetry={reload}
        query={search}
        onClearSearch={() => setSearch("")}
        onClearFilters={() => handleStatusChange("all")}
        hasFilters={hasActiveFilters}
        createLabel={canWrite ? t("offers.list.create") : undefined}
        onCreate={canWrite ? () => navigate("/offers/new") : undefined}
        emptyTitle={t("offers.list.empty")}
        emptyDescription={t("offers.list.subtitle")}
        skeletonCount={OFFERS_PAGE_SIZE / 2}
      />
    </>
  )
}
