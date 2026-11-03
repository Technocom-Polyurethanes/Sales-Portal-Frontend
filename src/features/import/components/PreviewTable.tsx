import { useState } from "react"

import Badge from "../../../components/ui/Badge"
import Button from "../../../components/ui/Button"
import DataTable, { type Column } from "../../../components/ui/DataTable"
import Icon from "../../../components/ui/Icon"
import Select from "../../../components/ui/Select"
import { useTranslation } from "../../../i18n/I18nProvider"
import type { TranslationKey } from "../../../i18n/types"
import { IDENTIFIER_FIELD, NAME_FIELD } from "../../../lib/import/columns"
import { fieldKey, STATUS_KEYS, STATUS_VARIANTS } from "../labels"
import type {
  ImportPreview,
  ImportRow,
  ImportRowStatus,
  ImportSource,
} from "../types"

const FILTERS: (ImportRowStatus | "all")[] = [
  "all",
  "new",
  "update",
  "unchanged",
  "error",
]

type SummaryItem = {
  key: TranslationKey
  field: keyof ImportPreview["summary"]
}

const SUMMARY: SummaryItem[] = [
  { key: "import.summary.total", field: "total" },
  { key: "import.summary.new", field: "new" },
  { key: "import.summary.update", field: "update" },
  { key: "import.summary.unchanged", field: "unchanged" },
  { key: "import.summary.error", field: "error" },
]

export type PreviewTableProps = {
  source: ImportSource
  preview: ImportPreview
  onDownloadErrors: () => void
}

/** Step 2: every row with its status, errors and the diff of an update. */
export default function PreviewTable({
  source,
  preview,
  onDownloadErrors,
}: PreviewTableProps) {
  const { t } = useTranslation()
  const [filter, setFilter] = useState<ImportRowStatus | "all">("all")

  const rows =
    filter === "all"
      ? preview.rows
      : preview.rows.filter((row) => row.status === filter)

  const columns: Column<ImportRow>[] = [
    {
      key: "row",
      header: t("import.row"),
      align: "end",
      render: (row) => row.rowNumber,
    },
    {
      key: "status",
      header: t("common.status"),
      render: (row) => (
        <Badge variant={STATUS_VARIANTS[row.status]}>
          {t(STATUS_KEYS[row.status])}
        </Badge>
      ),
    },
    {
      key: "values",
      header: t("import.values"),
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-ink">
            {row.values[IDENTIFIER_FIELD[source]] ?? "—"}
          </span>
          {source !== "prices" && (
            <span className="text-xs text-muted">
              {row.values[NAME_FIELD[source]] ?? "—"}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "details",
      header: t("import.details"),
      render: (row) => <Details row={row} />,
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {SUMMARY.map(({ key, field }) => (
          <Badge
            key={field}
            variant={field === "error" ? "rejected" : "neutral"}
          >
            {`${t(key)}: ${preview.summary[field]}`}
          </Badge>
        ))}
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          {t("import.filterStatus")}
          <Select
            value={filter}
            onChange={(event) =>
              setFilter(event.target.value as ImportRowStatus | "all")
            }
            className="w-48"
          >
            {FILTERS.map((status) => (
              <option key={status} value={status}>
                {status === "all"
                  ? t("import.allStatuses")
                  : `${t(STATUS_KEYS[status])} (${preview.summary[status]})`}
              </option>
            ))}
          </Select>
        </label>

        <Button
          variant="secondary"
          size="sm"
          onClick={onDownloadErrors}
          disabled={preview.summary.error === 0}
          icon={<Icon name="download" size={15} />}
        >
          {t("import.downloadErrors")}
        </Button>
      </div>

      <p className="text-xs text-muted">{t("import.previewHint")}</p>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => String(row.rowNumber)}
        empty={t("common.noResults")}
      />
    </div>
  )
}

function Details({ row }: { row: ImportRow }) {
  const { t } = useTranslation()

  if (row.errors.length > 0) {
    return (
      <ul className="flex list-disc flex-col gap-0.5 ps-4 text-xs text-danger">
        {row.errors.map((error) => (
          <li key={error}>{error}</li>
        ))}
      </ul>
    )
  }

  if (row.changes.length > 0) {
    return (
      <ul className="flex flex-col gap-0.5 text-xs text-muted">
        {row.changes.map((change) => (
          <li key={change.field}>
            <span className="font-medium text-ink">
              {t(fieldKey(change.field))}
            </span>
            {`: ${change.oldValue ?? "—"} → ${change.newValue ?? "—"}`}
          </li>
        ))}
      </ul>
    )
  }

  return <span className="text-xs text-muted">—</span>
}
