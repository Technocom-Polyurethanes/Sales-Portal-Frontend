import Badge from "../../../components/ui/Badge"
import { useTranslation } from "../../../i18n/I18nProvider"
import { outcomeLabel } from "../labels"
import type { AuditLog } from "../types"

export type AuditOutcomeProps = { row: AuditLog }

export default function AuditOutcome({ row }: AuditOutcomeProps) {
  const { t } = useTranslation()
  const label = outcomeLabel(row.outcome, t)

  if (row.outcome === "failure") {
    return (
      <Badge variant="rejected">
        {row.statusCode
          ? t("audit.failedStatus", { code: row.statusCode })
          : label}
      </Badge>
    )
  }

  return (
    <span className="inline-flex items-center gap-2 text-sm text-ink">
      <span aria-hidden="true" className="size-2 rounded-full bg-success" />
      {label}
    </span>
  )
}
