import Badge from "../../../components/ui/Badge"
import Button from "../../../components/ui/Button"
import Card from "../../../components/ui/Card"
import Icon, { type IconName } from "../../../components/ui/Icon"
import Toggle from "../../../components/ui/Toggle"
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
  autoRefresh,
  onAutoRefresh,
  hidden,
  staleSince,
  progressKey,
  refreshing,
  onRefresh,
}: {
  status: SystemStatus
  insight: Insight
  locale: Locale
  autoRefresh: boolean
  onAutoRefresh: (checked: boolean) => void
  hidden: boolean
  staleSince: string | null
  progressKey: number
  refreshing: boolean
  onRefresh: () => void
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

      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Toggle
          checked={autoRefresh}
          onChange={onAutoRefresh}
          label={`${t("system.autoRefresh")}: ${t(autoRefresh ? "system.on" : "system.off")}`}
          hint={hidden ? t("system.paused") : undefined}
        />
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onRefresh}
            disabled={refreshing}
          >
            {t("system.refresh")}
          </Button>
        </div>
      </div>

      <div
        className="mt-4 h-0.5 w-full overflow-hidden rounded bg-line-soft"
        aria-hidden="true"
      >
        {autoRefresh && !hidden ? (
          <span
            key={progressKey}
            className="status-progress block h-full w-full bg-primary"
          />
        ) : (
          <span className="block h-full w-full bg-line" />
        )}
      </div>
    </Card>
  )
}
