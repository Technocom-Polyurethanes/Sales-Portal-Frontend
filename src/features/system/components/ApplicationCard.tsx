import Badge from "../../../components/ui/Badge"
import { useTranslation } from "../../../i18n/I18nProvider"
import { formatDateTime } from "../../../lib/formatters/date"
import type { Locale } from "../../../lib/formatters/locale"
import { appVersion } from "../../../lib/version"
import type { SystemStatus } from "../types"

import CopyButton from "./CopyButton"
import DetailRow from "./DetailRow"
import { uptimeText } from "./insight"
import StatusCard from "./StatusCard"

export default function ApplicationCard({
  status,
  locale,
}: {
  status: SystemStatus
  locale: Locale
}) {
  const { t } = useTranslation()
  const differs = Boolean(status.apiVersion && status.apiVersion !== appVersion)

  return (
    <StatusCard
      title={t("system.cards.application")}
      headline={uptimeText(status.uptimeSeconds, t)}
    >
      <dl className="space-y-2.5">
        <DetailRow
          label={t("system.environment")}
          value={
            <Badge
              variant={
                status.environment === "Production" ? "neutral" : "draft"
              }
            >
              {status.environment}
            </Badge>
          }
        />
        <DetailRow label={t("system.version")} value={status.version} mono />
        <DetailRow
          label={t("system.labels.commit")}
          value={
            status.commit ? (
              <span className="inline-flex items-center gap-1">
                <span>{status.commit}</span>
                <CopyButton
                  value={status.commit}
                  label={t("system.labels.commit")}
                />
              </span>
            ) : undefined
          }
        />
        <DetailRow
          label={t("system.labels.startedAt")}
          value={formatDateTime(status.startedAt, locale) || undefined}
        />
        <DetailRow
          label={t("system.labels.apiVersion")}
          value={
            status.apiVersion ? (
              <span>
                {status.apiVersion}
                {differs ? ` / ${appVersion}` : ""}
              </span>
            ) : undefined
          }
          mono
        />
        {differs && (
          <DetailRow
            label={t("system.labels.frontendVersion")}
            value={appVersion}
            mono
          />
        )}
      </dl>
    </StatusCard>
  )
}
