import type { Locale } from "./locale"

export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale).format(value)
}

/** "2 minutes ago" / "منذ دقيقتين", through one localised formatter. */
export function formatRelative(
  value: string | null | undefined,
  now: number,
  locale: Locale,
): string {
  if (!value) return ""
  const time = new Date(value).getTime()
  if (Number.isNaN(time)) return ""
  const seconds = Math.round((now - time) / 1000)
  if (seconds < 0) return formatRelativeValue(0, "minute", locale)
  if (seconds < 60) return formatRelativeValue(0, "minute", locale)
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return formatRelativeValue(minutes, "minute", locale)
  const hours = Math.round(minutes / 60)
  if (hours < 24) return formatRelativeValue(hours, "hour", locale)
  return formatRelativeValue(Math.round(hours / 24), "day", locale)
}

export function formatRelativeValue(
  value: number,
  unit: Intl.RelativeTimeFormatUnit,
  locale: Locale,
): string {
  return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(
    -value,
    unit,
  )
}

/** `16d 9h 24m`; units are translated by the caller's i18n strings. */
export function splitUptime(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds || 0))
  return {
    days: Math.floor(safe / 86400),
    hours: Math.floor((safe % 86400) / 3600),
    minutes: Math.floor((safe % 3600) / 60),
  }
}

/** Human byte sizes, e.g. `1.4 GB`. */
export function formatSize(
  bytes: number | null | undefined,
  locale: Locale,
): string {
  const value = Number(bytes ?? 0)
  if (!Number.isFinite(value) || value <= 0) return "0 B"
  const units = ["B", "KB", "MB", "GB", "TB"]
  const index = Math.min(
    units.length - 1,
    Math.floor(Math.log(value) / Math.log(1024)),
  )
  const amount = value / 1024 ** index
  return `${new Intl.NumberFormat(locale, {
    maximumFractionDigits: index === 0 ? 0 : 1,
  }).format(amount)} ${units[index]}`
}

export function formatClock(
  value: string | null | undefined,
  locale: Locale,
): string {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date)
}
