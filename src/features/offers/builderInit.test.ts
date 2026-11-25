// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest"

import { prepareBuilderDraft, restoreBuilderDraft, type BuilderPersistence } from "./builderInit"
import { createEmptyDraft } from "./draft"
import { builderDraftKey, saveBuilderDraft } from "./draftStorage"

const user = { id: "u1", initials: "JD", fullName: "John Doe" }

function persistence(overrides: Partial<BuilderPersistence> = {}): BuilderPersistence {
  return {
    key: builderDraftKey("u1"),
    isRevision: false,
    sequenceEditable: false,
    customers: [{ id: "c1" }],
    banks: [],
    paymentTerms: [],
    ...overrides,
  }
}

afterEach(() => localStorage.clear())

// The reference carries the issue year, which a new draft takes from today.
const year = new Date().getFullYear()

describe("prepareBuilderDraft", () => {
  it("builds the reference from the type, the sequence and the user's initials", () => {
    const draft = prepareBuilderDraft(createEmptyDraft(), 42, user)

    expect(draft.sequence).toBe(42)
    expect(draft.reference).toBe(`Loc/0042-${year}/YL/JD`)
  })

  it("keeps the sequence and the initials of an existing reference", () => {
    const base = createEmptyDraft({ reference: "Int/7/YL/AB", offerType: "Int" })
    const draft = prepareBuilderDraft(base, 42, user)

    expect(draft.sequence).toBe(7)
    expect(draft.reference).toBe(`Int/0007-${year}/YL/AB`)
  })
})

describe("restoreBuilderDraft", () => {
  it("returns nothing when no copy was saved", () => {
    expect(restoreBuilderDraft(persistence(), 5, user)).toBeUndefined()
  })

  it("restores the form, the step and the save time", () => {
    const saved = createEmptyDraft({ customerId: "c1", attention: "Nader", notes: "Call first" })
    saveBuilderDraft(persistence().key, saved, 2, { now: Date.now() })

    const restored = restoreBuilderDraft(persistence(), 5, user)

    expect(restored?.draft.attention).toBe("Nader")
    expect(restored?.draft.notes).toBe("Call first")
    expect(restored?.draft.customerId).toBe("c1")
    expect(restored?.step).toBe(2)
    expect(restored?.savedAt).toBeGreaterThan(0)
  })

  it("moves a new offer to the current suggested sequence", () => {
    // The copy was made when 5 was next; another user has issued 5 and 6 since.
    const saved = prepareBuilderDraft(createEmptyDraft({ customerId: "c1" }), 5, user)
    saveBuilderDraft(persistence().key, saved, 0)

    const restored = restoreBuilderDraft(persistence(), 7, user)

    expect(restored?.draft.sequence).toBe(7)
    expect(restored?.draft.reference).toBe(`Loc/0007-${year}/YL/JD`)
  })

  it("keeps the offer type of the saved form when the sequence moves", () => {
    const saved = prepareBuilderDraft(
      createEmptyDraft({ customerId: "c1", offerType: "Int" }),
      5,
      user,
    )
    saveBuilderDraft(persistence().key, saved, 0)

    const restored = restoreBuilderDraft(persistence(), 7, user)

    expect(restored?.draft.reference).toBe(`Int/0007-${year}/YL/JD`)
  })

  it("keeps the starting number the user chose for the very first offer", () => {
    const saved = prepareBuilderDraft(createEmptyDraft({ customerId: "c1" }), 100, user)
    saveBuilderDraft(persistence().key, saved, 0)

    const restored = restoreBuilderDraft(persistence({ sequenceEditable: true }), 1, user)

    expect(restored?.draft.sequence).toBe(100)
    expect(restored?.draft.reference).toBe(`Loc/0100-${year}/YL/JD`)
  })

  it("keeps the reference a revision was derived from", () => {
    const key = builderDraftKey("u1", "offer-9")
    const saved = prepareBuilderDraft(
      createEmptyDraft({ customerId: "c1", reference: "Loc/3/YL/AB" }),
      9,
      user,
    )
    saveBuilderDraft(key, saved, 1)

    const restored = restoreBuilderDraft(persistence({ key, isRevision: true }), 9, user)

    expect(restored?.draft.reference).toBe(`Loc/0003-${year}/YL/AB`)
    expect(restored?.draft.sequence).toBe(3)
  })

  it("drops a customer that was deleted since the copy was made", () => {
    const saved = createEmptyDraft({ customerId: "deleted", attention: "Kept" })
    saveBuilderDraft(persistence().key, saved, 0)

    const restored = restoreBuilderDraft(persistence(), 5, user)

    expect(restored?.draft.customerId).toBe("")
    expect(restored?.draft.attention).toBe("Kept")
  })

  it("does not restore a copy that belongs to another user", () => {
    saveBuilderDraft(builderDraftKey("someone-else"), createEmptyDraft(), 0)

    expect(restoreBuilderDraft(persistence(), 5, user)).toBeUndefined()
  })
})
