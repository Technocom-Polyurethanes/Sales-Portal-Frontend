/**
 * Pure date helpers. Every date in the app is handled as an ISO calendar day
 * (`YYYY-MM-DD`) so that time zones can never shift a due date by a day.
 */

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

export type CalendarDate = {
  year: number
  month: number
  day: number
}

/** Parses `YYYY-MM-DD` into local calendar parts. Returns `null` when invalid. */
export function parseIsoDate(value: string): CalendarDate | null {
  const match = ISO_DATE.exec(value.trim())
  if (!match) return null

  const [, year, month, day] = match
  const parsed = { year: Number(year), month: Number(month), day: Number(day) }

  if (parsed.month < 1 || parsed.month > 12) return null
  if (parsed.day < 1 || parsed.day > 31) return null

  const date = new Date(parsed.year, parsed.month - 1, parsed.day)
  if (date.getFullYear() !== parsed.year) return null
  if (date.getMonth() !== parsed.month - 1) return null
  if (date.getDate() !== parsed.day) return null

  return parsed
}

export function isValidIsoDate(value: string): boolean {
  return parseIsoDate(value) !== null
}

/** Converts calendar parts back into an ISO day string. */
export function toIsoDate({ year, month, day }: CalendarDate): string {
  const pad = (part: number) => String(part).padStart(2, "0")
  return `${year}-${pad(month)}-${pad(day)}`
}

/** Adds (or subtracts) whole days to an ISO day string. */
export function addDays(value: string, days: number): string {
  const parsed = parseIsoDate(value)
  if (!parsed) return value

  const date = new Date(parsed.year, parsed.month - 1, parsed.day)
  date.setDate(date.getDate() + days)
  return toIsoDate({
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  })
}

/** Zero based month index (0 = January). */
export function monthIndex(value: string): number {
  return (parseIsoDate(value)?.month ?? 1) - 1
}

/** Weekday index (0 = Sunday). */
export function weekdayIndex(value: string): number {
  const parsed = parseIsoDate(value)
  if (!parsed) return 0
  return new Date(parsed.year, parsed.month - 1, parsed.day).getDay()
}

/** Today as an ISO calendar day in the local time zone. */
export function todayIso(): string {
  const now = new Date()
  return toIsoDate({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  })
}
