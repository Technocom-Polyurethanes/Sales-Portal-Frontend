import { Fragment } from "react"

import { useTranslation } from "../../../i18n/I18nProvider"
import type { Locale } from "../../../lib/formatters/locale"
import type { AuditLog } from "../types"
import AuditLogRow from "./AuditLogRow"
import { groupByDay } from "./groupByDay"

export type AuditLogTableProps = {
  rows: AuditLog[]
  openId: string | null
  newIds: Set<string>
  now: number
  locale: Locale
  onToggle: (id: string) => void
  onUser: (actorId: string) => void
  onRecord: (entityType: string, entityId: string) => void
}

const HEAD = "px-4 py-2.5 text-xs font-semibold text-muted"

export default function AuditLogTable({
  rows,
  openId,
  newIds,
  now,
  locale,
  onToggle,
  onUser,
  onRecord,
}: AuditLogTableProps) {
  const { t } = useTranslation()
  const groups = groupByDay(rows, locale, t)

  return (
    <div className="scrollbar-slim overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-surface-soft">
          <tr className="border-b border-line">
            <th scope="col" className={`${HEAD} w-24 text-start`}>
              {t("audit.fields.when")}
            </th>
            <th scope="col" className={`${HEAD} w-52 text-start`}>
              {t("audit.fields.actor")}
            </th>
            <th scope="col" className={`${HEAD} w-44 text-start`}>
              {t("audit.fields.action")}
            </th>
            <th scope="col" className={`${HEAD} text-start`}>
              {t("audit.row.description")}
            </th>
            <th scope="col" className={`${HEAD} w-28 text-start`}>
              {t("audit.fields.outcome")}
            </th>
            <th scope="col" className={`${HEAD} w-12`}>
              <span className="sr-only">{t("audit.row.details")}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <Fragment key={group.key}>
              <tr>
                <th
                  scope="colgroup"
                  colSpan={6}
                  className="sticky top-0 z-10 border-b border-line bg-surface-soft px-4 py-2 text-start text-xs font-semibold text-muted"
                >
                  {group.label}
                </th>
              </tr>
              {group.rows.map((row) => (
                <AuditLogRow
                  key={row.id}
                  row={row}
                  open={openId === row.id}
                  isNew={newIds.has(row.id)}
                  now={now}
                  locale={locale}
                  panelId={`audit-details-${row.id}`}
                  onToggle={onToggle}
                  onUser={onUser}
                  onRecord={onRecord}
                />
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}
