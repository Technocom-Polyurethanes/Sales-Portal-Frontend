import Badge from "../../../components/ui/Badge"
import { useTranslation } from "../../../i18n/I18nProvider"
import type { Locale } from "../../../lib/formatters/locale"
import { formatNumber, formatRelative } from "../../../lib/formatters/relative"
import { stateLabel } from "../labels"
import type { SystemLiveStatus } from "../types"

import CopyButton from "./CopyButton"
import DetailRow from "./DetailRow"
import { stateTone } from "./insight"
import StatusCard from "./StatusCard"

export default function LiveCard({
  live,
  now,
  locale,
}: {
  live: SystemLiveStatus
  now: number
  locale: Locale
}) {
  const { t } = useTranslation()
  const reconnect = live.reconnectCount ?? 0
  const lastEvent = (value: string | null | undefined) => {
    const relative = formatRelative(value, now, locale)
    return relative
      ? t("system.labels.lastEvent", { time: relative })
      : undefined
  }
  const channels = [
    {
      label: t("system.changes"),
      state: live.changes,
      at: live.changesLastEventAt,
    },
    {
      label: t("system.notifications"),
      state: live.notifications,
      at: live.notificationsLastEventAt,
    },
  ]

  return (
    <StatusCard
      title={t("system.cards.live")}
      status={stateLabel("live", live.state, t)}
      tone={stateTone(live.state)}
      headline={stateLabel("live", live.state, t)}
    >
      <dl className="space-y-2.5">
        {channels.map((channel) => (
          <DetailRow
            key={channel.label}
            label={channel.label}
            value={
              <span className="flex flex-wrap items-center justify-end gap-2">
                <Badge variant={stateTone(channel.state)}>
                  {stateLabel("live", channel.state, t)}
                </Badge>
                <span className="text-xs text-muted">
                  {lastEvent(channel.at) ?? "—"}
                </span>
              </span>
            }
          />
        ))}
        <DetailRow
          label={t("system.labels.reconnects")}
          value={
            <span className={reconnect > 3 ? "text-warning" : "text-muted"}>
              {t("system.labels.sinceStart", {
                count: formatNumber(reconnect, locale),
              })}
            </span>
          }
        />
        <DetailRow
          label={t("system.pollingFallback")}
          value={
            <Badge variant={live.pollingFallback ? "draft" : "accepted"}>
              {t(
                live.pollingFallback
                  ? "system.labels.fallbackActive"
                  : "system.labels.fallbackNotNeeded",
              )}
            </Badge>
          }
        />
      </dl>

      {live.lastError && (
        <div className="mt-4 rounded-lg border border-line-soft bg-page p-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-muted">
              {t("system.labels.lastError")}
            </span>
            <CopyButton
              value={live.lastError}
              label={t("system.labels.lastError")}
            />
          </div>
          <pre className="mt-1 break-words font-mono text-xs text-muted">
            {live.lastError}
          </pre>
        </div>
      )}
    </StatusCard>
  )
}
