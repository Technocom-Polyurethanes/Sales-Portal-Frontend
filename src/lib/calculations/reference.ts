import { monthIndex, parseIsoDate } from "./date"

/** Month abbreviations used inside an offer reference (legacy). */
export const MONTH_ABBREVIATIONS = [
  "JAN.",
  "FEB.",
  "MAR.",
  "APR.",
  "MAY",
  "JUN.",
  "JUL.",
  "AUG.",
  "SEP.",
  "OCT.",
  "NOV.",
  "DEC.",
] as const

export const DEFAULT_REFERENCE_SUFFIX = "YL/AA"

/**
 * The month shown in a reference always follows the issue date, so the same
 * sequence can be reused in a later month.
 */
export function monthAbbreviation(issueDate: string): string {
  const parsed = parseIsoDate(issueDate)
  if (!parsed) return MONTH_ABBREVIATIONS[0]
  return MONTH_ABBREVIATIONS[monthIndex(issueDate)]
}

/**
 * Builds a legacy offer reference such as `3089/OCT./YL/AA`.
 */
export function referenceNumber(
  sequence: number,
  issueDate: string,
  suffix: string = DEFAULT_REFERENCE_SUFFIX,
): string {
  return `${sequence}/${monthAbbreviation(issueDate)}/${suffix}`
}

/**
 * Builds the new offer reference such as `Loc/42/YL/JD` or `Int/43/YL/JD`.
 */
export function buildOfferReference(
  offerType: "Loc" | "Int",
  sequence: number,
  userInitials: string,
): string {
  const initials = (userInitials || "AA").toUpperCase().slice(0, 2)
  return `${offerType}/${sequence}/YL/${initials}`
}

/** The sequence number used for the next issued offer. */
export function nextReferenceSequence(sequence: number): number {
  return sequence + 1
}

/**
 * Reference preview shown next to the reference field, e.g.
 * `21/10/2026 → 3089/OCT./YL/AA`.
 */
export function referencePreview(
  sequence: number,
  issueDate: string,
  suffix: string = DEFAULT_REFERENCE_SUFFIX,
): string {
  return `${issueDate} → ${referenceNumber(sequence, issueDate, suffix)}`
}

/**
 * New reference preview using the new format.
 */
export function newReferencePreview(
  offerType: "Loc" | "Int",
  sequence: number,
  userInitials: string,
): string {
  return `${offerType}/${sequence}/YL/${(userInitials || "AA").toUpperCase().slice(0, 2)}`
}
