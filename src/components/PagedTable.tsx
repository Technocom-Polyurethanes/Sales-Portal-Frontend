import type { PaginatedResult } from "../lib/api/lookup"
import { useTranslation } from "../i18n/I18nProvider"
import TableState from "./TableState"
import Button from "./ui/Button"
import DataTable, { type Column } from "./ui/DataTable"

export type PagedTableProps<T,> = {
  data: PaginatedResult<T> | undefined
  loading: boolean
  error?: Error
  columns: Column<T>[]
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
  onPageChange: (page: number) => void
  onRetry?: () => void
  query?: string
  onClearSearch?: () => void
  onClearFilters?: () => void
  hasFilters?: boolean
  createLabel?: string
  onCreate?: () => void
  emptyTitle: string
  emptyDescription?: string
  skeletonColumns?: number
}

/** Table card with loading, empty, error and page controls in one place. */
export default function PagedTable<T>({
  data,
  loading,
  error,
  columns,
  rowKey,
  onRowClick,
  onPageChange,
  onRetry,
  query,
  onClearSearch,
  onClearFilters,
  hasFilters = false,
  createLabel,
  onCreate,
  emptyTitle,
  emptyDescription,
  skeletonColumns = 4,
}: PagedTableProps<T>) {
  const { t } = useTranslation()
  const rows = data?.items ?? []
  const state = error
    ? "error"
    : loading
      ? "loading"
      : rows.length === 0 && hasFilters
        ? "empty-results"
        : rows.length === 0
          ? "empty-data"
          : "data"

  return (
    <div className="rounded-lg border border-line bg-surface">
      <TableState
        state={state}
        query={query}
        errorMessage={error?.message}
        onRetry={onRetry}
        onClearSearch={onClearSearch}
        onClearFilters={onClearFilters}
        createLabel={createLabel}
        onCreate={onCreate}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        skeletonColumns={skeletonColumns}
      >
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={rowKey}
          onRowClick={onRowClick}
        />
      </TableState>

      {!error && data && data.totalCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-xs text-muted">
          <span>
            {t("common.showing", {
              count: data.items.length,
              total: data.totalCount,
            })}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={loading || data.page <= 1}
              onClick={() => onPageChange(data.page - 1)}
            >
              {t("common.previous")}
            </Button>
            <span>
              {t("common.page", { page: data.page, pages: data.totalPages })}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={loading || data.page >= data.totalPages}
              onClick={() => onPageChange(data.page + 1)}
            >
              {t("common.next")}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
