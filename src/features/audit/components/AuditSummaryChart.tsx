import { formatIsoDay } from "../../../lib/formatters/date"
import { localeForLanguage } from "../../../lib/formatters/locale"
import { useTranslation } from "../../../i18n/I18nProvider"
import type { AuditSummary } from "../types"

export type AuditSummaryChartProps = {
  summary: AuditSummary | undefined
  longRange: boolean
}

export default function AuditSummaryChart({
  summary,
  longRange,
}: AuditSummaryChartProps) {
  const { t, language } = useTranslation()
  const source = longRange ? summary?.byDay : summary?.byHour
  const values = Array.isArray(source) ? source : []
  const label = t(
    longRange ? "audit.summary.chartDay" : "audit.summary.chartHour",
  )

  if (values.length === 0) return null

  const locale = localeForLanguage(language)
  const max = Math.max(1, ...values)
  const labelAt = (index: number) => {
    if (!longRange) return `${String(index).padStart(2, "0")}:00`
    const key = summary?.byDayKeys?.[index]
    if (key) return formatIsoDay(key, locale)
    const day = new Date()
    day.setDate(day.getDate() - (values.length - 1 - index))
    return formatIsoDay(day.toISOString().slice(0, 10), locale)
  }

  // A chart is a timeline: hours and days stay left-to-right even in Arabic.
  return (
    <div className="rounded-xl border border-line-soft bg-surface px-3 py-2">
      <p className="mb-1.5 text-xs font-semibold text-muted">{label}</p>
      <div dir="ltr" className="flex h-9 items-end gap-0.5" aria-hidden="true">
        {values.map((value, index) => (
          <span
            key={index}
            title={`${labelAt(index)}: ${value}`}
            className="min-w-0 flex-1 rounded-t-sm bg-primary/60"
            style={{
              height: `${Math.max(value ? 10 : 2, (value / max) * 100)}%`,
            }}
          />
        ))}
      </div>
      <span className="sr-only">
        {t("audit.summary.chartSummary", { label, values: values.join(", ") })}
      </span>
    </div>
  )
}
