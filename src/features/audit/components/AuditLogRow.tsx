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

export type AuditLogRowProps = {
  row: AuditLog
  open: boolean
  isNew: boolean
  now: number
  locale: Locale
  panelId: string
  onToggle: (id: string) => void
  onUser: (actorId: string) => void
  onRecord: (entityType: string, entityId: string) => void
}

export default function AuditLogRow({
  row,
  open,
  isNew,
  now,
  locale,
  panelId,
  onToggle,
  onUser,
  onRecord,
}: AuditLogRowProps) {
  const { t } = useTranslation()
  const toggle = () => onToggle(row.id)
  const failed = row.outcome === "failure"

  return (
    <>
      <tr className={isNew ? "activity-row-new" : ""}>
        <td
          colSpan={3}
          className={`p-0 ${failed ? "border-s-2 border-danger/40" : ""}`}
        >
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            aria-controls={panelId}
            className="grid w-full grid-cols-3 items-center gap-3 px-4 py-3 text-start hover:bg-page"
          >
            <AuditWhen row={row} now={now} locale={locale} />
            <AuditActor row={row} />
            <AuditAction row={row} />
          </button>
        </td>
        <td className="p-0">
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={`${row.description} — ${t("audit.row.details")}`}
            className="block w-full px-4 py-3 text-start hover:bg-page"
          >
            <span
              className="line-clamp-2 text-sm text-ink"
              title={row.description}
            >
              {row.description}
            </span>
          </button>
          {row.entityRoute && row.entityLabel && (
            <Link
              to={row.entityRoute}
              className="block px-4 pb-3 text-xs text-primary hover:underline"
              dir="ltr"
            >
              {row.entityLabel}
            </Link>
          )}
        </td>
        <td className="p-0">
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            aria-controls={panelId}
            className="block w-full px-4 py-3 text-start hover:bg-page"
          >
            <AuditOutcome row={row} />
          </button>
        </td>
        <td className="p-0">
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={`${t("audit.row.details")}: ${row.description}`}
            className="activity-press flex size-11 items-center justify-center text-muted hover:text-primary"
          >
            <Icon
              name="chevron"
              size={16}
              className={`transition-transform ${open ? "rotate-90" : ""}`}
            />
          </button>
        </td>
      </tr>
      <tr>
        <td colSpan={6} className="p-0">
          <AuditExpansion id={panelId} open={open}>
            <AuditLogDetails row={row} onUser={onUser} onRecord={onRecord} />
          </AuditExpansion>
        </td>
      </tr>
    </>
  )
}
