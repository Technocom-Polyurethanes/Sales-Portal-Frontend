import {
  buildOfferReference,
  parseReference,
  referenceSequence,
  resolveInitials,
} from "../../lib/calculations/reference"
import type { AccountUser } from "../account/api"
import {
  loadBuilderDraft,
  sanitizeRestoredDraft,
  type RestoreContext,
} from "./draftStorage"
import type { OfferDraft } from "./types"

/**
 * The draft the builder starts from. The reference is automatic (offer type / sequence / YL /
 * user initials), so it is rebuilt here; an existing reference keeps its own initials.
 */
export function prepareBuilderDraft(
  base: OfferDraft,
  sequence: number,
  user: AccountUser | undefined,
): OfferDraft {
  const existing = base.reference.trim() ? parseReference(base.reference) : null
  const draftSequence = base.reference.trim()
    ? (referenceSequence(base.reference) ?? sequence)
    : sequence

  return {
    ...base,
    sequence: draftSequence,
    reference: buildOfferReference(
      base.offerType,
      draftSequence,
      existing?.initials ?? resolveInitials(user?.initials, user?.fullName ?? user?.name),
      base.issueDate,
    ),
    otherTaxPercent: base.otherTaxEnabled ? 1 : 0,
  }
}

export type BuilderPersistence = RestoreContext & {
  /** Storage slot of this builder (see builderDraftKey). */
  key: string
  /** A new version of an existing offer: its reference comes from the source and is kept. */
  isRevision: boolean
  /** Only the very first offer lets the user choose the starting sequence number. */
  sequenceEditable: boolean
}

export type RestoredBuilder = {
  draft: OfferDraft
  step: number
  savedAt: number
}

/**
 * The saved copy of this builder, prepared like a fresh draft, or undefined when there is none.
 *
 * The sequence is global and another user may have taken the saved number meanwhile, so a new
 * offer always continues from the current suggestion; only the first offer keeps the number the
 * user chose. A revision keeps the reference it was derived from.
 */
export function restoreBuilderDraft(
  persistence: BuilderPersistence,
  currentSequence: number,
  user: AccountUser | undefined,
): RestoredBuilder | undefined {
  const stored = loadBuilderDraft(persistence.key)
  if (!stored) return undefined

  const clean = sanitizeRestoredDraft(stored.draft, persistence)

  if (persistence.isRevision) {
    return {
      draft: prepareBuilderDraft(clean, currentSequence, user),
      step: stored.step,
      savedAt: stored.savedAt,
    }
  }

  const sequence =
    persistence.sequenceEditable && clean.sequence > 0
      ? clean.sequence
      : currentSequence
  return {
    draft: prepareBuilderDraft({ ...clean, reference: "" }, sequence, user),
    step: stored.step,
    savedAt: stored.savedAt,
  }
}
