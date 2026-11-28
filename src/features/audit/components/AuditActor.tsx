import Badge from "../../../components/ui/Badge"
import { useTranslation } from "../../../i18n/I18nProvider"
import type { AuditLog } from "../types"

export type AuditActorProps = { row: AuditLog }

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

export default function AuditActor({ row }: AuditActorProps) {
  const { t } = useTranslation()
  const anonymous = !row.actorUserId

  return (
    <span className="flex min-w-0 items-center gap-2">
      <span
        aria-hidden="true"
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary"
      >
        {anonymous ? "?" : initials(row.actorFullName)}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium text-ink">
          {anonymous ? t("audit.unknownUser") : row.actorFullName}
        </span>
        <span className="truncate text-xs text-muted" dir="ltr">
          @{row.actorUsername}
        </span>
      </span>
      {anonymous ? (
        <Badge>{t("audit.anonymous")}</Badge>
      ) : row.actorRole ? (
        <Badge>{row.actorRole}</Badge>
      ) : null}
    </span>
  )
}
