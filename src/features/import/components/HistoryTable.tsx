import Button from "../../../components/ui/Button"
import Card from "../../../components/ui/Card"
import DataTable, { type Column } from "../../../components/ui/DataTable"
import EmptyState from "../../../components/ui/EmptyState"
import Spinner from "../../../components/ui/Spinner"
import { useTranslation } from "../../../i18n/I18nProvider"
import { formatIsoDay } from "../../../lib/formatters"
import { SOURCE_KEYS } from "../labels"
import type { ImportHistoryItem, ImportHistoryPage } from "../types"

export type HistoryTableProps = {
  history?: ImportHistoryPage
  loading: boolean
  error?: Error
  onRetry: () => void
  page: number
  onPageChange: (page: number) => void
}

/** The committed import log shown under the flow. */
export default function HistoryTable({
  history,
  loading,
  error,
  onRetry,
  page,
  onPageChange,
}: HistoryTableProps) {
  const { t } = useTranslation()

  const columns: Column<ImportHistoryItem>[] = [
    {
      key: "date",
      header: t("import.history.date"),
      render: (item) =>
        item.committedAt ? formatIsoDay(item.committedAt.slice(0, 10)) : "—",
    },
    {
      key: "type",
      header: t("import.history.type"),
      render: (item) => t(SOURCE_KEYS[item.type]),
    },
    {
      key: "file",
      header: t("import.history.file"),
      render: (item) => (
        <span className="font-medium text-ink">{item.fileName}</span>
      ),
    },
    {
      key: "user",
      header: t("import.history.user"),
      render: (item) => item.createdByName ?? "—",
    },
    {
      key: "result",
      header: t("import.history.result"),
      render: (item) => (
        <span className="text-xs text-muted">
          {`${t("import.result.created")} ${item.created} · `}
          {`${t("import.result.updated")} ${item.updated} · `}
          {`${t("import.result.skipped")} ${item.skipped} · `}
          {`${t("import.result.failed")} ${item.failed}`}
        </span>
      ),
    },
  ]

  return (
    <Card
      title={t("import.history.title")}
      description={t("import.history.subtitle")}
    >
      {loading && (
        <div className="flex justify-center py-8">
          <Spinner size={24} />
        </div>
      )}

      {!loading && error && (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 py-6 text-center"
        >
          <p className="text-sm text-ink">{error.message}</p>
          <Button variant="secondary" size="sm" onClick={onRetry}>
            {t("common.retry")}
          </Button>
        </div>
      )}

      {!loading && !error && history && history.items.length === 0 && (
        <EmptyState title={t("import.history.empty")} />
      )}

      {!loading && !error && history && history.items.length > 0 && (
        <>
          <DataTable
            columns={columns}
            rows={history.items}
            rowKey={(item) => item.id}
          />

          {history.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
              >
                {t("common.previous")}
              </Button>
              <span className="text-xs text-muted">
                {t("common.page", {
                  page: history.page,
                  pages: history.totalPages,
                })}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= history.totalPages}
                onClick={() => onPageChange(page + 1)}
              >
                {t("common.next")}
              </Button>
            </div>
          )}
        </>
      )}
    </Card>
  )
}
