import type { Customer } from "../customers/types"
import type { BankAccount, PaymentTerm } from "../settings/types"
import { activeBankIds } from "./bankSelection"
import type { OfferDraft } from "./types"

/**
 * Temporary copy of the offer that is being built, so a refresh (or a crash, or an expired
 * session) does not cost the user the whole form. It lives until the offer is saved as a draft
 * or issued, or the user starts over. It is stored per user and per source: a new offer and a
 * revision of offer X each have their own slot.
 */

/** Bump when the shape of OfferDraft changes in a way an old copy cannot be restored from. */
const SCHEMA_VERSION = 1

/** A copy nobody came back to is dropped instead of resurfacing weeks later. */
export const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

export type StoredBuilderDraft = {
  v: number
  /** Epoch milliseconds of the last write. */
  savedAt: number
  /** The step the user was on. */
  step: number
  draft: OfferDraft
}

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem"> &
  Partial<Pick<Storage, "length" | "key">>

function defaultStorage(): StorageLike | undefined {
  // Reading `localStorage` itself throws when storage is blocked (some private modes).
  try {
    return typeof localStorage === "undefined" ? undefined : localStorage
  } catch {
    return undefined
  }
}

/** One slot per user and per source offer ("new" when the offer is not a revision). */
export function builderDraftKey(
  userId: string | undefined,
  sourceId?: string | null,
): string {
  return `technocom.offerBuilder.v${SCHEMA_VERSION}.${userId || "anonymous"}.${sourceId || "new"}`
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value)

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string")

/** Structural check: enough to be sure the builder can render it without crashing. */
export function isRestorableDraft(value: unknown): value is OfferDraft {
  if (!isRecord(value)) return false

  const strings = [
    "offerType",
    "reference",
    "customerId",
    "attention",
    "issueDate",
    "currency",
    "paymentTermId",
    "deliveryMode",
    "deliveryText",
    "deliveryPlace",
    "paymentTermsText",
    "notes",
    "documentLanguage",
  ]
  if (!strings.every((key) => typeof value[key] === "string")) return false

  const numbers = [
    "sequence",
    "validityDays",
    "taxPercent",
    "otherTaxPercent",
    "orderDiscountPercent",
  ]
  if (!numbers.every((key) => isFiniteNumber(value[key]))) return false

  if (typeof value.otherTaxEnabled !== "boolean") return false
  if (!isStringArray(value.bankAccountIds)) return false
  if (!Array.isArray(value.lines) || !Array.isArray(value.delivery)) return false

  const linesOk = value.lines.every(
    (line) =>
      isRecord(line) &&
      typeof line.id === "string" &&
      isFiniteNumber(line.ratePerKg) &&
      isFiniteNumber(line.discountPercent) &&
      Array.isArray(line.packaging) &&
      line.packaging.every(
        (row) =>
          isRecord(row) &&
          typeof row.id === "string" &&
          isFiniteNumber(row.weightPerPackageKg) &&
          isFiniteNumber(row.packages),
      ),
  )
  if (!linesOk) return false

  return value.delivery.every(
    (batch) =>
      isRecord(batch) &&
      typeof batch.id === "string" &&
      typeof batch.date === "string" &&
      Array.isArray(batch.allocations),
  )
}

/** Writes the copy. Returns false when storage is unavailable or full; callers can ignore that. */
export function saveBuilderDraft(
  key: string,
  draft: OfferDraft,
  step: number,
  options: { now?: number; storage?: StorageLike } = {},
): boolean {
  const storage = options.storage ?? defaultStorage()
  if (!storage) return false

  const payload: StoredBuilderDraft = {
    v: SCHEMA_VERSION,
    savedAt: options.now ?? Date.now(),
    step,
    draft,
  }
  try {
    storage.setItem(key, JSON.stringify(payload))
    return true
  } catch {
    return false
  }
}

export function clearBuilderDraft(key: string, storage?: StorageLike): void {
  try {
    ;(storage ?? defaultStorage())?.removeItem(key)
  } catch {
    // Nothing to clean up when storage is unavailable.
  }
}

/** Removes every saved builder draft for one user, including revisions of existing offers. */
export function clearBuilderDrafts(
  userId: string | undefined,
  storage?: StorageLike,
): void {
  const target = storage ?? defaultStorage()
  if (!target || typeof target.length !== "number" || typeof target.key !== "function") return

  const prefix = `technocom.offerBuilder.v${SCHEMA_VERSION}.${userId || "anonymous"}.`
  try {
    for (let index = target.length - 1; index >= 0; index -= 1) {
      const key = target.key(index)
      if (key?.startsWith(prefix)) target.removeItem(key)
    }
  } catch {
    // Nothing to clean up when storage is unavailable.
  }
}

/** The saved copy, or undefined when there is none, it is too old or it cannot be restored. */
export function loadBuilderDraft(
  key: string,
  options: { now?: number; storage?: StorageLike } = {},
): StoredBuilderDraft | undefined {
  const storage = options.storage ?? defaultStorage()
  if (!storage) return undefined

  let raw: string | null
  try {
    raw = storage.getItem(key)
  } catch {
    return undefined
  }
  if (!raw) return undefined

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    clearBuilderDraft(key, storage)
    return undefined
  }

  const now = options.now ?? Date.now()
  if (
    !isRecord(parsed) ||
    parsed.v !== SCHEMA_VERSION ||
    !isFiniteNumber(parsed.savedAt) ||
    now - parsed.savedAt > MAX_AGE_MS ||
    !isRestorableDraft(parsed.draft)
  ) {
    clearBuilderDraft(key, storage)
    return undefined
  }

  return {
    v: parsed.v,
    savedAt: parsed.savedAt,
    step: isFiniteNumber(parsed.step) ? Math.max(0, Math.floor(parsed.step)) : 0,
    draft: parsed.draft,
  }
}

export type RestoreContext = {
  customers: Pick<Customer, "id">[]
  banks: BankAccount[]
  paymentTerms: Pick<PaymentTerm, "id">[]
}

/**
 * Catalogue records can be deleted or deactivated between the save and the restore. A reference
 * to one that is gone is dropped (or replaced by the default) so the form never points at
 * something the API would refuse. An empty catalogue means it did not load, so nothing is touched.
 */
export function sanitizeRestoredDraft(
  draft: OfferDraft,
  context: RestoreContext,
): OfferDraft {
  const next: OfferDraft = { ...draft }

  if (
    next.customerId &&
    context.customers.length > 0 &&
    !context.customers.some((customer) => customer.id === next.customerId)
  ) {
    next.customerId = ""
  }

  if (
    next.paymentTermId &&
    context.paymentTerms.length > 0 &&
    !context.paymentTerms.some((term) => term.id === next.paymentTermId)
  ) {
    next.paymentTermId = context.paymentTerms[0].id
  }

  if (context.banks.length > 0 && next.bankAccountIds.length > 0) {
    const known = new Set(context.banks.map((bank) => bank.id))
    const kept = next.bankAccountIds.filter((id) => known.has(id))
    next.bankAccountIds = kept.length > 0 ? kept : activeBankIds(context.banks)
  }

  return next
}
