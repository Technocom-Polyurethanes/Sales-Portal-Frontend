import { Link } from "react-router-dom"

import Icon from "../../../components/ui/Icon"
import { useTranslation } from "../../../i18n/I18nProvider"
import type { Locale } from "../../../lib/formatters/locale"
import { formatNumber, formatRelative } from "../../../lib/formatters/relative"
import type { SystemSecurity } from "../types"

import DetailRow from "./DetailRow"
import StatusCard from "./StatusCard"

export default function SecurityCard({
  security,
  now,
  locale,
}: {
  security?: SystemSecurity
  now: number
  locale: Locale
}) {
  const { t } = useTranslation()
  const failed = security?.failedSignIns24h ?? 0

  return (
    <StatusCard
      title={t("system.cards.security")}
      headline={
        <span className={failed > 5 ? "text-warning" : undefined}>
          {security?.failedSignIns24h == null
            ? "—"
            : formatNumber(failed, locale)}
        </span>
      }
    >
      <dl className="space-y-2.5">
        <DetailRow
          label={t("system.labels.lastFailed")}
          value={
            formatRelative(security?.lastFailedSignInAt, now, locale) ||
            undefined
          }
        />
        <DetailRow
          label={t("system.labels.activeUsers")}
          value={
            security?.activeUsers == null
              ? undefined
              : formatNumber(security.activeUsers, locale)
          }
        />
        <DetailRow
          label={t("system.labels.inactiveUsers")}
          value={
            security?.inactiveUsers == null
              ? undefined
              : formatNumber(security.inactiveUsers, locale)
          }
        />
      </dl>
      <Link
        to="/audit-logs?outcome=failure&category=auth&preset=today"
        className="mt-4 inline-flex min-h-6 items-center gap-2 text-sm font-semibold text-primary hover:underline"
      >
        {t("system.labels.viewFailed")}
        <Icon name="arrow" size={16} />
      </Link>
    </StatusCard>
  )
}
