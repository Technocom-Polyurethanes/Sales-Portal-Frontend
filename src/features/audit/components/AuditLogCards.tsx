import { Link } from "react-router-dom"

import Icon from "../../../components/ui/Icon"
import { useTranslation } from "../../../i18n/I18nProvider"
import type { Locale } from "../../../lib/formatters/locale"
import type { AuditLog } from "../types"
import AuditAction from "./AuditAction"
import AuditActor from "./AuditActor"
import AuditExpansion from "./AuditExpansion"
import AuditLogDetails from "./AuditLogDetails"
import AuditOutcome from "./AuditOutcome"
import AuditWhen from "./AuditWhen"
import { groupByDay } from "./groupByDay"

export type AuditLogCardsProps = {
  rows: AuditLog[]
  openId: string | null
  newIds: Set<string>
  now: number
  locale: Locale
  onToggle: (id: string) => void
  onUser: (actorId: string) => void
  onRecord: (entityType: string, entityId: string) => void
}

export default function AuditLogCards({
  rows,
  openId,
  newIds,
  now,
  locale,
  onToggle,
  onUser,
  onRecord,
}: AuditLogCardsProps) {
  const { t } = useTranslation()
  const groups = groupByDay(rows, locale, t)

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <section
          key={group.key}
          className="rounded-xl border border-line-soft bg-surface"
        >
          <h3 className="sticky top-0 z-10 rounded-t-xl border-b border-line bg-surface-soft px-3 py-2 text-xs font-semibold text-muted">
            {group.label}
          </h3>
          {group.rows.map((row) => {
            const open = openId === row.id
            const panelId = `audit-details-${row.id}`
            return (
              <article
                key={row.id}
                className={`border-b border-line-soft last:border-0 ${
                  row.outcome === "failure"
                    ? "border-s-2 border-s-danger/40"
                    : ""
                } ${newIds.has(row.id) ? "activity-row-new" : ""}`}
              >
                <div className="flex items-start gap-1 p-3">
                  <button
                    type="button"
                    onClick={() => onToggle(row.id)}
                    aria-expanded={open}
                    aria-controls={panelId}
                    className="min-w-0 flex-1 space-y-2 text-start"
                  >
                    <span className="flex items-center justify-between gap-2">
                      <AuditWhen row={row} now={now} locale={locale} />
                      <AuditOutcome row={row} />
                    </span>
                    <AuditActor row={row} />
                    <AuditAction row={row} />
                    <span className="block text-sm text-ink">
                      {row.description}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggle(row.id)}
                    aria-expanded={open}
                    aria-controls={panelId}
                    aria-label={`${t("audit.row.details")}: ${row.description}`}
                    className="activity-press flex size-11 shrink-0 items-center justify-center text-muted"
                  >
                    <Icon
                      name="chevron"
                      size={16}
                      className={`transition-transform ${
                        open ? "rotate-90" : ""
                      }`}
                    />
                  </button>
                </div>
                {row.entityRoute && row.entityLabel && (
                  <Link
                    to={row.entityRoute}
                    className="block px-3 pb-3 text-xs text-primary hover:underline"
                    dir="ltr"
                  >
                    {row.entityLabel}
                  </Link>
                )}
                <AuditExpansion id={panelId} open={open}>
                  <AuditLogDetails
                    row={row}
                    onUser={onUser}
                    onRecord={onRecord}
                  />
                </AuditExpansion>
              </article>
            )
          })}
        </section>
      ))}
    </div>
  )
}
