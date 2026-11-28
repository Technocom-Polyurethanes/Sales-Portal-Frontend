import Badge from "../../../components/ui/Badge"
import Card from "../../../components/ui/Card"
import Icon, { type IconName } from "../../../components/ui/Icon"
import { useTranslation } from "../../../i18n/I18nProvider"
import type { Locale } from "../../../lib/formatters/locale"
import { formatClock } from "../../../lib/formatters/relative"
import { formatNumber } from "../../../lib/formatters/relative"
import { stateLabel } from "../labels"
import type { SystemStatus } from "../types"

import { stateTone, type Insight } from "./insight"

const TONE_TEXT = {
  accepted: "text-success",
  draft: "text-warning",
  rejected: "text-danger",
  issued: "text-primary",
  neutral: "text-ink",
} as const

const TONE_ICON: Record<keyof typeof TONE_TEXT, IconName> = {
  accepted: "check",
  draft: "pulse",
  rejected: "close",
  issued: "pulse",
  neutral: "clock",
}

export default function StatusBanner({
  status,
  insight,
  locale,
  staleSince,
}: {
  status: SystemStatus
  insight: Insight
  locale: Locale
  staleSince: string | null
}) {
  const { t } = useTranslation()
  const tone = stateTone(status.status)
  const params = {
    time: formatClock(status.checkedAt, locale),
    count: formatNumber(insight.count ?? 0, locale),
  }

  return (
    <Card
      className="mb-6"
      title={t("system.overall")}
      actions={
        <Badge variant={tone}>{stateLabel("overall", status.status, t)}</Badge>
      }
    >
      {staleSince && (
        <p
          role="status"
          className="mb-4 flex items-center gap-2 rounded-lg border border-line-soft bg-page px-3 py-2 text-sm text-muted"
        >
          <Icon name="clock" size={16} />
          {t("system.stale", { time: formatClock(staleSince, locale) })}
        </p>
      )}

      <div className="flex items-start gap-3">
        <Icon
          name={TONE_ICON[insight.tone]}
          size={20}
          className={`mt-0.5 shrink-0 ${TONE_TEXT[insight.tone]}`}
        />
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold text-ink">
            {t(insight.reasonKey, params)}
          </p>
          <p className="flex items-start gap-2 text-sm text-muted">
            <Icon name="arrow" size={16} className="mt-0.5 shrink-0" />
            {t(insight.nextKey)}
          </p>
        </div>
      </div>
    </Card>
  )
}
