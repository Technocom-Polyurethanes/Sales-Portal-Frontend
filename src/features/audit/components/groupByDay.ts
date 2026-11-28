import { formatIsoDay, formatTimestampDay } from "../../../lib/formatters/date"
import type { Locale } from "../../../lib/formatters/locale"
import type { TranslateFunction } from "../../../i18n/I18nProvider"
import type { AuditLog } from "../types"

export type DayGroup = {
  key: string
  label: string
  rows: AuditLog[]
}

function isoDay(date: Date): string {
  const pad = (part: number) => String(part).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function groupByDay(
  rows: AuditLog[],
  locale: Locale,
  t: TranslateFunction,
): DayGroup[] {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const todayKey = formatIsoDay(isoDay(today), locale)
  const yesterdayKey = formatIsoDay(isoDay(yesterday), locale)
  const groups = new Map<string, DayGroup>()

  for (const row of rows) {
    const key = formatTimestampDay(row.occurredAt, locale)
    const group = groups.get(key) ?? {
      key,
      label:
        key === todayKey
          ? t("audit.days.today")
          : key === yesterdayKey
            ? t("audit.days.yesterday")
            : key,
      rows: [],
    }
    group.rows.push(row)
    groups.set(key, group)
  }

  return [...groups.values()]
}
