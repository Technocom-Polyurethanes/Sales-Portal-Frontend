import { useTranslation } from "../../../i18n/I18nProvider"
import type { Locale } from "../../../lib/formatters/locale"
import { formatNumber } from "../../../lib/formatters/relative"
import type { SystemRealtime } from "../types"

import DetailRow from "./DetailRow"
import StatusCard from "./StatusCard"

export default function RealtimeCard({
  realtime,
  locale,
}: {
  realtime?: SystemRealtime
  locale: Locale
}) {
  const { t } = useTranslation()
  const clients = realtime?.connectedClients
  const queue = realtime?.notificationQueueDepth
  const dropped = realtime?.dropped ?? 0

  return (
    <StatusCard
      title={t("system.cards.realtime")}
      headline={clients == null ? "—" : formatNumber(clients, locale)}
    >
      <dl className="space-y-2.5">
        <DetailRow
          label={t("system.labels.connectedClients")}
          value={clients == null ? undefined : formatNumber(clients, locale)}
        />
        <DetailRow
          label={t("system.labels.queueDepth")}
          value={queue == null ? undefined : formatNumber(queue, locale)}
        />
        <DetailRow
          label={t("system.labels.dropped")}
          value={
            <span className={dropped > 0 ? "text-danger" : "text-muted"}>
              {realtime?.dropped == null ? "—" : formatNumber(dropped, locale)}
            </span>
          }
        />
      </dl>
      {dropped > 0 && (
        <p className="mt-3 text-xs text-danger">
          {t("system.labels.droppedHint")}
        </p>
      )}
    </StatusCard>
  )
}
