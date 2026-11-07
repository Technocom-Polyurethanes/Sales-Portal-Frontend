import { parseIsoDate } from "../calculations/date"
import type { Locale } from "./locale"

const DAY_NAMES: Record<Locale, string[]> = {
  "en-US": [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ],
  "ar-EG": [
    "الأحد",
    "الاثنين",
    "الثلاثاء",
    "الأربعاء",
    "الخميس",
    "الجمعة",
    "السبت",
  ],
}

/** `21/10/2026` */
export function formatIsoDay(value: string): string {
  const parsed = parseIsoDate(value)
  if (!parsed) return value
  const pad = (part: number) => String(part).padStart(2, "0")
  return `${pad(parsed.day)}/${pad(parsed.month)}/${parsed.year}`
}

/** Localised long date, e.g. `21 October 2026`. */
export function formatLongDate(
  value: string,
  locale: Locale = "en-US",
): string {
  const parsed = parseIsoDate(value)
  if (!parsed) return value
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(parsed.year, parsed.month - 1, parsed.day))
}

/** Localised weekday name, e.g. `Thursday`. */
export function formatWeekday(value: string, locale: Locale = "en-US"): string {
  const parsed = parseIsoDate(value)
  if (!parsed) return ""
  const index = new Date(parsed.year, parsed.month - 1, parsed.day).getDay()
  return DAY_NAMES[locale][index]
}

/** `Sunday 25/10/2026` */
export function formatDateWithWeekday(
  value: string,
  locale: Locale = "en-US",
): string {
  const weekday = formatWeekday(value, locale)
  if (!weekday) return value
  return `${weekday} ${formatIsoDay(value)}`
}

/**
 * `21/10/2026 14:05` in the viewer's time zone, for a timestamp such as `2026-10-21T11:05:00Z`.
 * A plain day (`2026-10-21`) has no time, so it is shown as a day only.
 */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return ""
  if (/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return formatIsoDay(value)

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const pad = (part: number) => String(part).padStart(2, "0")
  return (
    `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}`
  )
}

/** `21/10/2026` for a timestamp, in the viewer's time zone. */
export function formatTimestampDay(value: string | null | undefined): string {
  if (!value) return ""
  return formatDateTime(value).split(" ")[0]
}
