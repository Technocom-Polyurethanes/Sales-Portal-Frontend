import Badge from "../../../components/ui/Badge"
import { useTranslation } from "../../../i18n/I18nProvider"
import type { Locale } from "../../../lib/formatters/locale"
import { formatNumber, formatRelative } from "../../../lib/formatters/relative"
import type { SystemJob } from "../types"

import { msText, stateTone } from "./insight"
import StatusCard from "./StatusCard"

export default function JobsCard({
  jobs,
  now,
  locale,
}: {
  jobs?: SystemJob[]
  now: number
  locale: Locale
}) {
  const { t } = useTranslation()
  const rows = jobs ?? []
  const resultLabel = (result?: string | null) => {
    if (!result) return "—"
    if (result === "success") return t("system.results.success")
    if (result === "failure") return t("system.results.failure")
    return result
  }

  return (
    <StatusCard
      title={t("system.cards.jobs")}
      headline={formatNumber(rows.length, locale)}
    >
      {rows.length === 0 ? (
        <p className="text-sm text-muted">—</p>
      ) : (
        <div className="-mx-1 overflow-x-auto">
          <table className="w-full min-w-[34rem] text-start text-xs">
            <thead className="text-muted">
              <tr>
                <th scope="col" className="px-1 pb-2 font-semibold">
                  {t("system.labels.lastRun")}
                </th>
                <th scope="col" className="px-1 pb-2 font-semibold">
                  {t("system.labels.duration")}
                </th>
                <th scope="col" className="px-1 pb-2 font-semibold">
                  {t("system.labels.result")}
                </th>
                <th scope="col" className="px-1 pb-2 font-semibold">
                  {t("system.labels.nextRun")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {rows.map((job) => (
                <tr key={job.name} className="align-top text-ink">
                  <th scope="row" className="px-1 py-2 text-start font-medium">
                    <span className="block">{job.name}</span>
                    <span className="block text-muted">
                      {formatRelative(job.lastRunAt, now, locale) || "—"}
                    </span>
                  </th>
                  <td className="px-1 py-2" dir="ltr">
                    {msText(job.durationMs, locale, t)}
                  </td>
                  <td className="px-1 py-2">
                    <Badge variant={stateTone(job.result)}>
                      {resultLabel(job.result)}
                    </Badge>
                  </td>
                  <td className="px-1 py-2 text-muted">
                    {formatRelative(job.nextRunAt, now, locale) || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </StatusCard>
  )
}
