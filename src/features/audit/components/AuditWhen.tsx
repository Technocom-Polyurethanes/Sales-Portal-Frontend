import { formatDateTime } from "../../../lib/formatters/date"
import type { Locale } from "../../../lib/formatters/locale"
import { formatRelative } from "../../../lib/formatters/relative"
import type { AuditLog } from "../types"

export type AuditWhenProps = {
  row: AuditLog
  now: number
  locale: Locale
}

export default function AuditWhen({ row, now, locale }: AuditWhenProps) {
  return (
    <span
      className="block text-xs text-muted"
      title={formatDateTime(row.occurredAt, locale)}
    >
      {formatRelative(row.occurredAt, now, locale)}
    </span>
  )
}
