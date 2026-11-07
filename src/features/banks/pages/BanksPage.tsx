import { useMemo, useState } from "react"

import PageHeader from "../../../app/layout/PageHeader"
import PagedTable from "../../../components/PagedTable"
import Badge from "../../../components/ui/Badge"
import Button from "../../../components/ui/Button"
import type { Column } from "../../../components/ui/DataTable"
import Icon from "../../../components/ui/Icon"
import SearchField from "../../../components/ui/SearchField"
import { usePermissions } from "../../account/hooks/usePermissions"
import { useTranslation } from "../../../i18n/I18nProvider"
import { useAsyncData } from "../../../lib/hooks/useAsyncData"
import type { BankAccount } from "../../settings/types"
import { banksApi } from "../api"
import BankDialog from "../components/BankDialog"

export default function BanksPage() {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const canCreate = can("catalog.create")
  const canEdit = can("catalog.edit")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<BankAccount | undefined>()
  const { data, loading, error, reload } = useAsyncData(
    () => banksApi.listPage(search, page),
    [search, page],
  )

  const openNew = () => {
    setEditing(undefined)
    setDialogOpen(true)
  }
  const openEdit = (bank: BankAccount) => {
    setEditing(bank)
    setDialogOpen(true)
  }

  const columns = useMemo<Column<BankAccount>[]>(() => {
    const list: Column<BankAccount>[] = [
      {
        key: "bank",
        header: t("banks.bank"),
        render: (bank) => (
          <span className="font-medium text-ink">{bank.bank}</span>
        ),
      },
      {
        key: "branch",
        header: t("banks.branch"),
        render: (bank) => <span className="text-muted">{bank.branch}</span>,
      },
      {
        key: "accountNumber",
        header: t("banks.accountNumber"),
        render: (bank) => (
          <span dir="ltr" className="text-muted">
            {bank.accountNumber}
          </span>
        ),
      },
      {
        key: "currency",
        header: t("common.currency"),
        render: (bank) => <span className="text-muted">{bank.currency}</span>,
      },
      {
        key: "status",
        header: t("common.status"),
        render: (bank) => (
          <Badge variant={bank.isActive === false ? "neutral" : "accepted"}>
            {t(bank.isActive === false ? "banks.inactive" : "banks.active")}
          </Badge>
        ),
      },
    ]

    if (canEdit) {
      list.push({
        key: "actions",
        header: t("common.actions"),
        align: "end",
        render: (bank) => (
          <Button variant="ghost" size="sm" onClick={() => openEdit(bank)}>
            <Icon name="edit" size={15} />
            {t("common.edit")}
          </Button>
        ),
      })
    }

    return list
  }, [t, canEdit])

  return (
    <>
      <PageHeader
        title={t("banks.title")}
        subtitle={t("banks.subtitle")}
        action={
          canCreate ? (
            <Button
              variant="primary"
              icon={<Icon name="plus" size={18} />}
              onClick={openNew}
            >
              {t("banks.newBank")}
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
          placeholder={t("banks.search")}
        />
      </div>

      <PagedTable
        data={data}
        loading={loading}
        error={error}
        columns={columns}
        rowKey={(bank) => bank.id}
        onPageChange={setPage}
        onRetry={reload}
        query={search}
        onClearSearch={() => {
          setSearch("")
          setPage(1)
        }}
        hasFilters={search.trim() !== ""}
        createLabel={canCreate ? t("banks.newBank") : undefined}
        onCreate={canCreate ? openNew : undefined}
        emptyTitle={t("banks.empty")}
        skeletonColumns={canEdit ? 6 : 5}
      />

      {dialogOpen && (
        <BankDialog
          key={editing?.id ?? "new"}
          open
          bank={editing}
          onClose={() => setDialogOpen(false)}
          onSaved={reload}
        />
      )}
    </>
  )
}
