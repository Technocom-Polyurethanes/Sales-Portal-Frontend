import { useTranslation } from "../../../i18n/I18nProvider"
import { localeForLanguage } from "../../../lib/formatters/locale"
import { formatNumber, formatRelative } from "../../../lib/formatters/relative"
import { useNow } from "../../../lib/hooks/useNow"
import type { AuditSummary } from "../types"
import AuditSummaryChart from "./AuditSummaryChart"

export type AuditSummaryStripProps = {
  summary: AuditSummary | undefined
  longRange: boolean
  onFilter: (key: "category" | "outcome", value: string) => void
}

const TILE = "rounded-xl border border-line-soft bg-surface px-3 py-2.5"
const CAPTION = "text-xs font-medium text-muted"
const VALUE = "mt-0.5 text-lg font-semibold text-ink"

export default function AuditSummaryStrip({
  summary,
  longRange,
  onFilter,
}: AuditSummaryStripProps) {
  const { t, language } = useTranslation()
  const now = useNow()
  const locale = localeForLanguage(language)
  const actions = summary?.actions ?? 0
  const failures = summary?.failures ?? 0
  const signIns = summary?.signIns ?? 0
  const failedSignIns = summary?.failedSignIns ?? 0
  const activeUsers = summary?.activeUsers ?? 0
  const lastFailed = summary?.lastFailedSignInAt
  const lastFailedUser = summary?.lastFailedSignInUsername

  return (
    <section
      className="mb-4 grid gap-2"
      aria-label={t("audit.summary.actions")}
    >
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
        <div className={TILE}>
          <p className={CAPTION}>{t("audit.summary.actions")}</p>
          <p className={VALUE}>{formatNumber(actions, locale)}</p>
        </div>
        <button
          type="button"
          className={`${TILE} activity-press text-start hover:bg-page`}
          onClick={() => onFilter("outcome", "failure")}
          aria-label={`${t("audit.summary.failed")}: ${formatNumber(failures, locale)}`}
        >
          <p className={CAPTION}>{t("audit.summary.failed")}</p>
          <p className={`${VALUE} ${failures > 0 ? "text-danger" : ""}`}>
            {formatNumber(failures, locale)}
          </p>
        </button>
        <button
          type="button"
          className={`${TILE} activity-press text-start hover:bg-page`}
          onClick={() => onFilter("category", "auth")}
          aria-label={`${t("audit.summary.signIns")}: ${formatNumber(signIns, locale)}`}
        >
          <p className={CAPTION}>{t("audit.summary.signIns")}</p>
          <p className={VALUE}>{formatNumber(signIns, locale)}</p>
          <p className="truncate text-xs text-muted">
            {t("audit.summary.failedCount", {
              count: formatNumber(failedSignIns, locale),
            })}
          </p>
        </button>
        <div className={TILE}>
          <p className={CAPTION}>{t("audit.summary.activeUsers")}</p>
          <p className={VALUE}>{formatNumber(activeUsers, locale)}</p>
        </div>
        <div className={`${TILE} min-w-0`}>
          <p className={CAPTION}>{t("audit.summary.lastFailedSignIn")}</p>
          <p className="mt-0.5 truncate text-sm font-semibold text-ink">
            {lastFailed
              ? formatRelative(lastFailed, now, locale)
              : t("audit.summary.none")}
          </p>
          {lastFailed && lastFailedUser && (
            <p className="truncate text-xs text-muted" dir="ltr">
              @{lastFailedUser}
            </p>
          )}
        </div>
      </div>
      <AuditSummaryChart summary={summary} longRange={longRange} />
    </section>
  )
}
