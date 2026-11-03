import { addDays, isValidIsoDate } from "./date"

/** Days an offer stays valid when nothing else is typed. */
export const DEFAULT_VALIDITY_DAYS = 7

/** Longest validity the builder accepts. */
export const MAX_VALIDITY_DAYS = 365

/**
 * A validity typed in the builder as a whole number of days, between 0 and
 * `MAX_VALIDITY_DAYS`. Anything that is not a number counts as 0, which hides
 * the validity row of the document.
 */
export function normalizeValidityDays(value: unknown): number {
  const days = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(days)) return 0
  return Math.min(MAX_VALIDITY_DAYS, Math.max(0, Math.floor(days)))
}

/**
 * Day an offer expires: the issue date shifted by the validity.
 * Returns an ISO day string (`YYYY-MM-DD`).
 */
export function expiryDateFrom(issueDate: string, days: number): string {
  if (!isValidIsoDate(issueDate)) return issueDate
  return addDays(issueDate, normalizeValidityDays(days))
}
