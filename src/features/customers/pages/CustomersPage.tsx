import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import PageHeader from "../../../app/layout/PageHeader"
import PagedTable from "../../../components/PagedTable"
import Button from "../../../components/ui/Button"
import Icon from "../../../components/ui/Icon"
import SearchField from "../../../components/ui/SearchField"
import { useTranslation } from "../../../i18n/I18nProvider"
import { formatIsoDay } from "../../../lib/formatters/date"
import { localeForLanguage } from "../../../lib/formatters/locale"
import { formatCurrency } from "../../../lib/formatters/number"
import { useAsyncData } from "../../../lib/hooks/useAsyncData"
import { usePermissions } from "../../account/hooks/usePermissions"
import { customersApi } from "../api"
import { type Column } from "../../../components/ui/DataTable"
import CustomerDialog from "../components/CustomerDialog"
import type { Customer } from "../types"

export default function CustomersPage() {
  const { t, language } = useTranslation()
  const navigate = useNavigate()
  const { can } = usePermissions()
  const canCreate = can("catalog.create")
  const canEdit = can("catalog.edit")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | undefined>()
  const { data, loading, error, reload } = useAsyncData(
    () => customersApi.listPage(search, page),
    [search, page],
  )

  const locale = localeForLanguage(language)
  const openNew = () => {
    setEditing(undefined)
    setDialogOpen(true)
  }
  const openEdit = (customer: Customer) => {
    setEditing(customer)
    setDialogOpen(true)
  }

  const columns = useMemo<Column<Customer>[]>(
    () => [
      {
        key: "code",
        header: t("customers.code"),
        render: (customer) => (
          <span dir="ltr" className="text-muted">
            {customer.customerCode ?? customer.code}
          </span>
        ),
      },
      {
        key: "name",
        header: t("customers.name"),
        render: (customer) => (
          <span className="font-medium text-ink">{customer.name}</span>
        ),
      },
      {
        key: "contact",
        header: t("customers.contact"),
        secondary: true,
        render: (customer) => (
          <span className="text-muted">{customer.contactPerson || "—"}</span>
        ),
      },
      {
        key: "offers",
        header: t("customers.offers"),
        align: "end",
        render: (customer) => (
          <span className="text-ink">{customer.offersCount ?? 0}</span>
        ),
      },
      {
        key: "totalValue",
        header: t("customers.totalValue"),
        align: "end",
        render: (customer) => (
          <span className="font-medium text-ink">
            {formatCurrency(customer.totalValue ?? 0, "EGP", locale)}
          </span>
        ),
      },
      {
        key: "lastOffer",
        header: t("customers.lastOffer"),
        secondary: true,
        render: (customer) => (
          <span className="text-muted">
            {customer.lastOfferDate
              ? formatIsoDay(customer.lastOfferDate)
              : "—"}
          </span>
        ),
      },
      {
        key: "actions",
        header: t("common.actions"),
        align: "end",
        render: (customer) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={(event) => {
              event.stopPropagation()
              openEdit(customer)
            }}
          >
            <Icon name="edit" size={15} />
            {t("common.edit")}
          </Button>
        ),
      },
    ],
    [t, locale],
  )

  // A role that may create but not edit (Sales) sees no Edit button.
  const visibleColumns = canEdit
    ? columns
    : columns.filter((column) => column.key !== "actions")

  return (
    <>
      <PageHeader
        title={t("customers.title")}
        subtitle={t("customers.subtitle")}
        action={
          canCreate ? (
            <Button
              variant="primary"
              icon={<Icon name="plus" size={18} />}
              onClick={openNew}
            >
              {t("customers.newCustomer")}
            </Button>
          ) : undefined
        }
      />

      <div className="mb-4">
        <SearchField
          value={search}
          onChange={(value) => {
            setSearch(value)
            setPage(1)
          }}
          placeholder={t("customers.search")}
        />
      </div>

      <PagedTable
        data={data}
        loading={loading}
        error={error}
        columns={visibleColumns}
        rowKey={(customer) => customer.id}
        onRowClick={(customer) => navigate(`/customers/${customer.id}`)}
        onPageChange={setPage}
        onRetry={reload}
        query={search}
        onClearSearch={() => {
          setSearch("")
          setPage(1)
        }}
        hasFilters={search.trim() !== ""}
        createLabel={canCreate ? t("customers.newCustomer") : undefined}
        onCreate={canCreate ? openNew : undefined}
        emptyTitle={t("customers.empty")}
        skeletonColumns={visibleColumns.length}
      />

      {dialogOpen && (
        <CustomerDialog
          key={editing?.id ?? "new"}
          open
          customer={editing}
          onClose={() => setDialogOpen(false)}
          onSaved={reload}
        />
      )}
    </>
  )
}
