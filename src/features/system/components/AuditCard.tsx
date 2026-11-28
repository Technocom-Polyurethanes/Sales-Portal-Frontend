import { useTranslation } from "../../../i18n/I18nProvider"
import type { Locale } from "../../../lib/formatters/locale"
import { formatNumber, formatRelative } from "../../../lib/formatters/relative"
import type { SystemAudit } from "../types"

import DetailRow from "./DetailRow"
import StatusCard from "./StatusCard"

export default function AuditCard({
  audit,
  now,
  locale,
}: {
  audit?: SystemAudit
  now: number
  locale: Locale
}) {
  const { t } = useTranslation()
  const dropped = audit?.dropped ?? 0

  return (
    <StatusCard
      title={t("system.cards.audit")}
      headline={
        audit?.rowsTotal == null ? "—" : formatNumber(audit.rowsTotal, locale)
      }
    >
      <dl className="space-y-2.5">
        <DetailRow
          label={t("system.labels.rowsTotal")}
          value={
            audit?.rowsTotal == null
              ? undefined
              : formatNumber(audit.rowsTotal, locale)
          }
        />
        <DetailRow
          label={t("system.labels.queueDepth")}
          value={
            audit?.queueDepth == null
              ? undefined
              : formatNumber(audit.queueDepth, locale)
          }
        />
        <DetailRow
          label={t("system.labels.dropped")}
          value={
            <span className={dropped > 0 ? "text-danger" : "text-muted"}>
              {audit?.dropped == null ? "—" : formatNumber(dropped, locale)}
            </span>
          }
        />
        <DetailRow
          label={t("system.labels.lastWrite")}
          value={formatRelative(audit?.lastWriteAt, now, locale) || undefined}
        />
        <DetailRow
          label={t("system.labels.retention")}
          value={
            audit?.retentionDays == null
              ? undefined
              : t("system.labels.days", {
                  count: formatNumber(audit.retentionDays, locale),
                })
          }
        />
      </dl>
    </StatusCard>
  )
}
