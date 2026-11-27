import { useState } from "react"

import PageHeader from "../../../app/layout/PageHeader"
import PagedTable from "../../../components/PagedTable"
import Badge, { type BadgeVariant } from "../../../components/ui/Badge"
import type { Column } from "../../../components/ui/DataTable"
import { useTranslation } from "../../../i18n/I18nProvider"
import { localeForLanguage } from "../../../lib/formatters/locale"
import { formatDateTime } from "../../../lib/formatters/date"
import { useAsyncData } from "../../../lib/hooks/useAsyncData"
import { auditApi } from "../api"
import AuditLogFilters, {
  type AuditFiltersState,
} from "../components/AuditLogFilters"
import { actionLabel, categoryLabel, outcomeLabel } from "../labels"
import type { AuditLog } from "../types"

const EMPTY_FILTERS: AuditFiltersState = {
  search: "",
  from: "",
  to: "",
  actorId: "",
  category: "",
  action: "",
  outcome: "",
}

const badgeVariant = (outcome: string): BadgeVariant =>
  outcome === "success"
    ? "accepted"
    : outcome === "failure"
      ? "rejected"
      : "neutral"

/** Admin only: the append-only record of who changed what, newest first. */
export default function AuditLogPage() {
  const { t, language } = useTranslation()
  const [values, setValues] = useState<AuditFiltersState>(EMPTY_FILTERS)
  const [page, setPage] = useState(1)

  const change = (key: keyof AuditFiltersState, value: string) => {
    setValues((current) => ({ ...current, [key]: value }))
    setPage(1)
  }

  const clear = () => {
    setValues(EMPTY_FILTERS)
    setPage(1)
  }

  const filters = useAsyncData(() => auditApi.filters())
  const logs = useAsyncData(
    () =>
      auditApi.list({
        search: values.search,
        from: values.from,
        to: values.to,
        actorId: values.actorId,
        category: values.category,
        action: values.action,
        outcome: values.outcome,
        page,
      }),
    [
      values.search,
      values.from,
      values.to,
      values.actorId,
      values.category,
      values.action,
      values.outcome,
      page,
    ],
    { live: ["audit"] },
  )

  const hasFilters = Object.values(values).some((value) => value.trim() !== "")

  const columns: Column<AuditLog>[] = [
    {
      key: "occurredAt",
      header: t("audit.fields.when"),
      render: (row) =>
        formatDateTime(row.occurredAt, localeForLanguage(language)),
    },
    {
      key: "actor",
      header: t("audit.fields.actor"),
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-ink">{row.actorFullName}</span>
          <span className="text-xs text-muted" dir="ltr">
            @{row.actorUsername}
          </span>
        </div>
      ),
    },
    {
      key: "action",
      header: t("audit.fields.action"),
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-ink">
            {actionLabel(row.action, t)}
          </span>
          <span className="text-xs text-muted">
            {categoryLabel(row.category, t)}
          </span>
        </div>
      ),
    },
    {
      key: "details",
      header: t("audit.fields.details"),
      secondary: true,
      render: (row) => (
        <div className="flex max-w-md flex-col text-xs text-muted">
          <span className="truncate text-sm text-ink" title={row.description}>
            {row.description}
          </span>
          {(row.entityLabel || row.path) && (
            <span className="truncate" dir="ltr" title={row.path ?? undefined}>
              {row.entityLabel || row.path}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "outcome",
      header: t("audit.fields.outcome"),
      align: "end",
      render: (row) => (
        <Badge variant={badgeVariant(row.outcome)}>
          {outcomeLabel(row.outcome, t)}
        </Badge>
      ),
    },
  ]

  return (
    <>
      <PageHeader title={t("audit.title")} subtitle={t("audit.subtitle")} />
      <AuditLogFilters
        filters={filters.data}
        values={values}
        onChange={change}
        onClear={clear}
        hasFilters={hasFilters}
      />
      <PagedTable
        data={logs.data}
        loading={logs.loading}
        error={logs.error}
        columns={columns}
        rowKey={(row) => row.id}
        onPageChange={setPage}
        onRetry={logs.reload}
        query={values.search}
        onClearSearch={() => change("search", "")}
        onClearFilters={clear}
        hasFilters={hasFilters}
        emptyTitle={t("audit.empty")}
        skeletonColumns={5}
      />
    </>
  )
}
