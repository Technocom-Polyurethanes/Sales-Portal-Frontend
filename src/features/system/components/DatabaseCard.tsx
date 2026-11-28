import type { BadgeVariant } from "../../../components/ui/Badge"
import { useTranslation } from "../../../i18n/I18nProvider"
import type { Locale } from "../../../lib/formatters/locale"
import { formatNumber, formatSize } from "../../../lib/formatters/relative"
import { stateLabel } from "../labels"
import type { SystemDatabaseStatus } from "../types"

import DetailRow from "./DetailRow"
import { msText, stateTone } from "./insight"
import Sparkline from "./Sparkline"
import StatusCard from "./StatusCard"

export default function DatabaseCard({
  database,
  samples,
  locale,
}: {
  database: SystemDatabaseStatus
  samples: number[]
  locale: Locale
}) {
  const { t } = useTranslation()
  const latency = database.latencyMs
  const tone: BadgeVariant =
    latency > 500 ? "rejected" : latency >= 150 ? "draft" : "neutral"
  const latencyClass =
    tone === "rejected"
      ? "text-danger"
      : tone === "draft"
        ? "text-warning"
        : "text-ink"
  const used = database.connectionsUsed
  const max = database.connectionsMax
  const pending = database.pendingMigrations
  const history = [...(database.latencyHistory ?? []), ...samples].slice(-20)

  return (
    <StatusCard
      title={t("system.cards.database")}
      status={stateLabel("database", database.status, t)}
      tone={stateTone(database.status)}
      headline={
        <span className={latencyClass}>{msText(latency, locale, t)}</span>
      }
    >
      <dl className="space-y-2.5">
        <DetailRow
          label={t("system.latency")}
          value={
            <Sparkline
              samples={history}
              tone={tone}
              label={t("system.latency")}
            />
          }
        />
        <DetailRow
          label={t("system.labels.serverVersion")}
          value={database.serverVersion ?? undefined}
          mono
        />
        <DetailRow
          label={t("system.labels.size")}
          value={
            database.sizeBytes == null
              ? undefined
              : formatSize(database.sizeBytes, locale)
          }
        />
        <DetailRow
          label={t("system.labels.connections")}
          value={
            used == null || max == null
              ? undefined
              : `${formatNumber(used, locale)} / ${formatNumber(max, locale)}`
          }
        />
        {used != null && max != null && max > 0 && (
          <div
            className="h-1 w-full overflow-hidden rounded bg-line-soft"
            aria-hidden="true"
          >
            <div
              className="h-full bg-primary"
              style={{ width: `${Math.min(100, (used / max) * 100)}%` }}
            />
          </div>
        )}
        <DetailRow
          label={t("system.labels.migrations")}
          value={
            pending == null
              ? undefined
              : pending > 0
                ? t("system.labels.pending", {
                    count: formatNumber(pending, locale),
                  })
                : t("system.labels.upToDate")
          }
        />
        <DetailRow
          label={t("system.labels.lastMigration")}
          value={database.lastMigration ?? undefined}
          mono
        />
      </dl>
    </StatusCard>
  )
}
