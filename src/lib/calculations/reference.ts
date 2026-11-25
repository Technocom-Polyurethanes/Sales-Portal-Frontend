export type OfferType = "Loc" | "Int"

/** Static company identifier printed in every reference. */
export const REFERENCE_COMPANY_CODE = "YL"

const REFERENCE_PATTERN =
  /^(Loc|Int)\/(\d+)(?:-(\d{4}))?\/YL\/([A-Za-z0-9]+)$/i

export type ParsedReference = {
  offerType: OfferType
  sequence: number
  /** 0 on legacy references that have no year segment. */
  year: number
  initials: string
}

/**
 * Initials printed in the reference. Stored initials win (dots and spaces are
 * dropped so the reference stays valid), otherwise the first letters of the
 * full name are used. Mirrors `ReferenceRules.InitialsFrom` in the backend.
 */
export function resolveInitials(initials?: string, fullName?: string): string {
  const cleaned = (initials ?? "").replace(/[^\p{L}\p{N}]/gu, "").toUpperCase()
  if (cleaned) return cleaned

  const derived = (fullName ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join("")

  return derived || "NA"
}

/**
 * Builds an offer reference such as `Loc/0042-2026/YL/JD`: offer type /
 * zero-padded sequence - issue year / `YL` / user initials.
 */
export function buildOfferReference(
  offerType: OfferType,
  sequence: number,
  initials: string,
  issueDate: string,
): string {
  const year = issueDate.slice(0, 4)
  return `${offerType}/${String(sequence).padStart(4, "0")}-${year}/${REFERENCE_COMPANY_CODE}/${initials.trim().toUpperCase()}`
}

/** Reads the parts of a reference, or `null` for a legacy one. */
export function parseReference(reference: string): ParsedReference | null {
  const match = REFERENCE_PATTERN.exec(reference.trim())
  if (!match) return null

  const type = match[1]!.toLowerCase() === "loc" ? "Loc" : "Int"
  return {
    offerType: type,
    sequence: Number.parseInt(match[2]!, 10),
    year: match[3] ? Number.parseInt(match[3], 10) : 0,
    initials: match[4]!.toUpperCase(),
  }
}

/**
 * Sequence of a stored reference. Legacy references such as `3089/OCT./YL/AA`
 * carry it as the first segment.
 */
export function referenceSequence(reference: string): number | null {
  const parsed = parseReference(reference)
  if (parsed) return parsed.sequence

  const first = Number.parseInt(reference.split("/")[0] ?? "", 10)
  return Number.isFinite(first) ? first : null
}

/** The sequence used for the next issued offer. */
export function nextReferenceSequence(sequence: number): number {
  return sequence + 1
}
