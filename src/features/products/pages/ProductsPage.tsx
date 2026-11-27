import { useMemo, useState } from "react"
import PageHeader from "../../../app/layout/PageHeader"
import PagedTable from "../../../components/PagedTable"
import Badge from "../../../components/ui/Badge"
import Button from "../../../components/ui/Button"
import ConfirmDialog from "../../../components/ui/ConfirmDialog"
import type { Column } from "../../../components/ui/DataTable"
import Icon from "../../../components/ui/Icon"
import SearchField from "../../../components/ui/SearchField"
import Select from "../../../components/ui/Select"
import { useTranslation } from "../../../i18n/I18nProvider"
import { localeForLanguage } from "../../../lib/formatters/locale"
import { formatNumber } from "../../../lib/formatters/number"
import { useAsyncData } from "../../../lib/hooks/useAsyncData"
import { useDelete } from "../../../lib/hooks/useDelete"
import { usePermissions } from "../../account/hooks/usePermissions"
import { settingsApi } from "../../settings/api"
import { productsApi } from "../api"
import MaterialDialog from "../components/MaterialDialog"
import type { Product } from "../types"

export default function ProductsPage() {
  const { t, language } = useTranslation()

  const { can } = usePermissions()

  const canCreate = can("catalog.create")

  const canEdit = can("catalog.edit")

  const canDelete = can("catalog.delete")

  const [search, setSearch] = useState("")

  const [category, setCategory] = useState("")

  const [page, setPage] = useState(1)

  const [dialogOpen, setDialogOpen] = useState(false)

  const [editing, setEditing] = useState<Product | undefined>()

  const { data, loading, error, reload, refresh } = useAsyncData(
    () => productsApi.listPage(search, category, page),

    [search, category, page],
    { live: ["materials", "catalog"] },
  )

  const { data: catalogue, refresh: refreshCatalogue } = useAsyncData(
    () => productsApi.list().catch(() => []),

    [],
    { live: ["materials"] },
  )

  const { data: packageTypes } = useAsyncData(
    () => settingsApi.packageTypes().catch(() => []),

    [],
    { live: ["catalog"] },
  )

  const deletion = useDelete({
    remove: (product: Product) => productsApi.delete(product.id),

    name: (product: Product) => product.name,

    onDeleted: () => {
      refresh()

      refreshCatalogue()
    },
  })

  const locale = localeForLanguage(language)

  const categories = useMemo(
    () =>
      [
        ...new Set(
          (catalogue ?? []).map((item) => item.category).filter(Boolean),
        ),
      ].sort(),

    [catalogue],
  )

  const packageName = (product: Product) =>
    product.defaultPackageTypeName ??
    packageTypes?.find((type) => type.id === product.defaultPackageTypeId)
      ?.name ??
    "—"

  const openNew = () => {
    setEditing(undefined)

    setDialogOpen(true)
  }

  const openEdit = (product: Product) => {
    setEditing(product)

    setDialogOpen(true)
  }

  const columns = useMemo<Column<Product>[]>(
    () => [
      {
        key: "code",

        header: t("products.code"),

        render: (product) => (
          <span dir="ltr" className="text-muted">
            {product.itemCode ?? product.code}
          </span>
        ),
      },

      {
        key: "name",

        header: t("products.material"),

        render: (product) => (
          <span className="font-medium text-ink">{product.name}</span>
        ),
      },

      {
        key: "category",

        header: t("products.category"),

        render: (product) => (
          <span className="text-muted">{product.category}</span>
        ),
      },

      {
        key: "packaging",

        header: t("products.defaultPackaging"),

        secondary: true,

        render: (product) => (
          <span className="text-muted">{packageName(product)}</span>
        ),
      },

      {
        key: "price",

        header: t("products.pricePerKg"),

        align: "end",

        render: (product) => (
          <span className="font-medium text-ink">
            {formatNumber(product.referencePrice, locale)}
          </span>
        ),
      },

      {
        key: "status",

        header: t("common.status"),

        render: (product) => (
          <Badge variant={product.isActive === false ? "neutral" : "accepted"}>
            {t(
              product.isActive === false
                ? "products.inactive"
                : "products.active",
            )}
          </Badge>
        ),
      },

      {
        key: "actions",

        header: t("common.actions"),

        align: "end",

        render: (product) => (
          <div className="flex flex-wrap justify-end gap-1">
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openEdit(product)}
              >
                <Icon name="edit" size={15} />
                {t("common.edit")}
              </Button>
            )}
            {canDelete && (
              <Button
                variant="danger"
                size="sm"
                data-testid="delete-button"
                aria-label={t("common.deleteTitle", { name: product.name })}
                className="w-8 shrink-0 px-0!"
                onClick={() => deletion.setTarget(product)}
              >
                <Icon name="trash" size={18} />
              </Button>
            )}
          </div>
        ),
      },
    ],

    [t, locale, packageTypes, canEdit, canDelete],
  )

  const hasFilters = search.trim() !== "" || category !== ""

  const visibleColumns =
    canEdit || canDelete
      ? columns
      : columns.filter((column) => column.key !== "actions")

  return (
    <>
      <PageHeader
        title={t("products.title")}
        subtitle={t("products.subtitle")}
        action={
          canCreate ? (
            <Button
              variant="primary"
              icon={<Icon name="plus" size={18} />}
              onClick={openNew}
            >
              {t("products.addMaterial")}
            </Button>
          ) : undefined
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchField
          value={search}
          onChange={(value) => {
            setSearch(value)

            setPage(1)
          }}
          placeholder={t("products.search")}
        />
        <Select
          value={category}
          onChange={(event) => {
            setCategory(event.target.value)

            setPage(1)
          }}
          aria-label={t("products.category")}
          className="min-w-0 w-full flex-1 sm:w-56 sm:flex-none"
        >
          <option value="">{t("common.all")}</option>
          {categories.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </Select>
      </div>

      <PagedTable
        data={data}
        loading={loading}
        error={error}
        columns={visibleColumns}
        rowKey={(product) => product.id}
        onPageChange={setPage}
        onRetry={reload}
        query={search}
        onClearSearch={() => {
          setSearch("")

          setPage(1)
        }}
        onClearFilters={() => {
          setCategory("")

          setPage(1)
        }}
        hasFilters={hasFilters}
        createLabel={canCreate ? t("products.addMaterial") : undefined}
        onCreate={canCreate ? openNew : undefined}
        emptyTitle={t("products.empty")}
        skeletonColumns={visibleColumns.length}
      />

      {dialogOpen && (
        <MaterialDialog
          key={editing?.id ?? "new"}
          open
          product={editing}
          packageTypes={packageTypes ?? []}
          onClose={() => setDialogOpen(false)}
          onSaved={refresh}
        />
      )}

      <ConfirmDialog
        open={deletion.target !== undefined}
        title={deletion.title}
        message={deletion.message}
        loading={deletion.busy}
        onConfirm={deletion.confirm}
        onClose={() => deletion.setTarget(undefined)}
      />
    </>
  )
}
