import PageHeader from "../../../app/layout/PageHeader"
import Button from "../../../components/ui/Button"
import Card from "../../../components/ui/Card"
import Badge, { type BadgeVariant } from "../../../components/ui/Badge"
import { useTranslation } from "../../../i18n/I18nProvider"
import { formatDateTime } from "../../../lib/formatters/date"
import { localeForLanguage } from "../../../lib/formatters/locale"
import { useAsyncData } from "../../../lib/hooks/useAsyncData"

import { systemApi } from "../api"
import { stateLabel } from "../labels"

const badgeVariant = (value: string): BadgeVariant => {
  if (value === "Healthy" || value === "Up" || value === "connected") {
    return "accepted"
  }
  if (value === "Unhealthy" || value === "Down" || value === "disconnected") {
    return "rejected"
  }
  return "draft"
}

/** Admin only: the diagnostics behind /health, plus the build and live listeners. */
export default function SystemStatusPage() {
  const { t, language } = useTranslation()
  const status = useAsyncData(() => systemApi.status())

  const action = (
    <Button variant="secondary" onClick={status.reload} disabled={status.loading}>
      {t("system.refresh")}
    </Button>
  )

  if (status.error) {
    return (
      <>
        <PageHeader
          title={t("system.title")}
          subtitle={t("system.subtitle")}
          action={action}
        />
        <Card>
          <div role="alert" className="flex flex-col items-start gap-3">
            <p className="text-sm text-ink">{status.error.message}</p>
            <Button variant="secondary" size="sm" onClick={status.reload}>
              {t("common.retry")}
            </Button>
          </div>
        </Card>
      </>
    )
  }

  if (!status.data) {
    return (
      <>
        <PageHeader
          title={t("system.title")}
          subtitle={t("system.subtitle")}
          action={action}
        />
        <Card>
          <p role="status" className="text-sm text-muted">
            {t("common.loading")}
          </p>
        </Card>
      </>
    )
  }

  const { data } = status
  const locale = localeForLanguage(language)

  return (
    <>
      <PageHeader
        title={t("system.title")}
        subtitle={t("system.subtitle")}
        action={action}
      />
      <div className="divide-y divide-line-soft rounded-xl border border-line-soft bg-surface">
        <section className="p-4 sm:p-5">
          <header className="flex flex-wrap items-start justify-between gap-3">
            <h2 className="text-base font-semibold text-ink">
              {t("system.overall")}
            </h2>
            <Badge variant={badgeVariant(data.status)}>
              {stateLabel("overall", data.status, t)}
            </Badge>
          </header>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">{t("system.checkedAt")}</dt>
              <dd className="text-ink" dir="ltr">
                {formatDateTime(data.checkedAt, locale)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">{t("system.version")}</dt>
              <dd className="text-ink" dir="ltr">
                {data.version}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">{t("system.environment")}</dt>
              <dd className="text-ink">{data.environment}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">{t("system.uptime")}</dt>
              <dd className="text-ink" dir="ltr">
                {data.uptimeSeconds} s
              </dd>
            </div>
          </dl>
        </section>

        <section className="p-4 sm:p-5">
          <header className="flex flex-wrap items-start justify-between gap-3">
            <h2 className="text-base font-semibold text-ink">
              {t("system.database")}
            </h2>
            <Badge variant={badgeVariant(data.database.status)}>
              {stateLabel("database", data.database.status, t)}
            </Badge>
          </header>
          <div className="mt-4 flex justify-between gap-3 text-sm">
            <span className="text-muted">{t("system.latency")}</span>
            <span className="text-ink" dir="ltr">
              {data.database.latencyMs} ms
            </span>
          </div>
        </section>

        <section className="p-4 sm:p-5">
          <header className="flex flex-wrap items-start justify-between gap-3">
            <h2 className="text-base font-semibold text-ink">
              {t("system.live")}
            </h2>
          </header>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted">{t("system.liveState")}</span>
              <Badge variant={badgeVariant(data.live.state)}>
                {stateLabel("live", data.live.state, t)}
              </Badge>
            </div>
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-muted">{t("system.changes")}</span>
              <Badge variant={badgeVariant(data.live.changes)}>
                {stateLabel("live", data.live.changes, t)}
              </Badge>
            </div>
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-muted">{t("system.notifications")}</span>
              <Badge variant={badgeVariant(data.live.notifications)}>
                {stateLabel("live", data.live.notifications, t)}
              </Badge>
            </div>
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-muted">{t("system.pollingFallback")}</span>
              <Badge variant={badgeVariant(data.live.pollingFallback ? "success" : "destructive")}>
                {data.live.pollingFallback ? t("common.yes") : t("common.no")}
              </Badge>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
