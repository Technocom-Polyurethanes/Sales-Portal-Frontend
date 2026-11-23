import { describe, expect, it } from "vitest"

import type { BankAccount } from "../settings/types"
import { createEmptyDraft } from "./draft"
import {
  MAX_AGE_MS,
  builderDraftKey,
  clearBuilderDraft,
  isRestorableDraft,
  loadBuilderDraft,
  sanitizeRestoredDraft,
  saveBuilderDraft,
} from "./draftStorage"
import type { OfferDraft } from "./types"

/** A Map behind the Storage interface, so the tests do not depend on a browser. */
function memoryStorage(seed: Record<string, string> = {}) {
  const data = new Map(Object.entries(seed))
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  }
}

function sampleDraft(overrides: Partial<OfferDraft> = {}): OfferDraft {
  return createEmptyDraft({
    customerId: "customer-1",
    attention: "Nader William",
    notes: "Handle with care",
    lines: [
      {
        id: "line-1",
        productId: "product-1",
        materialName: "DALTORIM EG 26200 - D",
        materialCode: "DAL-1",
        category: "Polyol",
        ratePerKg: 42.5,
        discountPercent: 0,
        packaging: [
          {
            id: "pack-1",
            packageTypeId: "drum",
            packageTypeName: "Drum",
            weightPerPackageKg: 210,
            packages: 19,
          },
        ],
      },
    ],
    delivery: [
      {
        id: "batch-1",
        batchNumber: 1,
        date: "2026-12-01",
        allocations: [{ packagingRowId: "pack-1", packages: 10 }],
      },
    ],
    ...overrides,
  })
}

const bank = (id: string, extra: Partial<BankAccount> = {}) =>
  ({ id, bank: id, isActive: true, sortOrder: 0, ...extra }) as BankAccount

describe("builderDraftKey", () => {
  it("separates users and source offers", () => {
    expect(builderDraftKey("u1")).not.toBe(builderDraftKey("u2"))
    expect(builderDraftKey("u1")).not.toBe(builderDraftKey("u1", "offer-9"))
    expect(builderDraftKey("u1", "offer-9")).toBe(builderDraftKey("u1", "offer-9"))
  })

  it("has a slot for a missing user and for a new offer", () => {
    expect(builderDraftKey(undefined)).toContain("anonymous")
    expect(builderDraftKey("u1", null)).toContain(".new")
  })
})

describe("save and load", () => {
  it("brings back exactly what was saved, with the step and the time", () => {
    const storage = memoryStorage()
    const key = builderDraftKey("u1")
    const draft = sampleDraft()

    expect(saveBuilderDraft(key, draft, 3, { now: 1_000, storage })).toBe(true)
    const loaded = loadBuilderDraft(key, { now: 2_000, storage })

    expect(loaded?.draft).toEqual(draft)
    expect(loaded?.step).toBe(3)
    expect(loaded?.savedAt).toBe(1_000)
  })

  it("finds nothing in an empty slot", () => {
    expect(loadBuilderDraft("missing", { storage: memoryStorage() })).toBeUndefined()
  })

  it("drops a copy older than the maximum age", () => {
    const storage = memoryStorage()
    saveBuilderDraft("k", sampleDraft(), 0, { now: 0, storage })

    expect(loadBuilderDraft("k", { now: MAX_AGE_MS, storage })).toBeDefined()
    expect(loadBuilderDraft("k", { now: MAX_AGE_MS + 1, storage })).toBeUndefined()
    expect(storage.data.has("k")).toBe(false)
  })

  it("removes a copy that is not valid JSON", () => {
    const storage = memoryStorage({ k: "{not json" })

    expect(loadBuilderDraft("k", { storage })).toBeUndefined()
    expect(storage.data.has("k")).toBe(false)
  })

  it("removes a copy written by another schema version", () => {
    const storage = memoryStorage({
      k: JSON.stringify({ v: 99, savedAt: Date.now(), step: 0, draft: sampleDraft() }),
    })

    expect(loadBuilderDraft("k", { storage })).toBeUndefined()
    expect(storage.data.has("k")).toBe(false)
  })

  it("removes a copy whose draft is damaged", () => {
    const storage = memoryStorage()
    const broken = { ...sampleDraft(), lines: "not a list" }
    storage.setItem(
      "k",
      JSON.stringify({ v: 1, savedAt: Date.now(), step: 0, draft: broken }),
    )

    expect(loadBuilderDraft("k", { storage })).toBeUndefined()
    expect(storage.data.has("k")).toBe(false)
  })

  it("falls back to the first step when the saved step is not a number", () => {
    const storage = memoryStorage()
    storage.setItem(
      "k",
      JSON.stringify({ v: 1, savedAt: Date.now(), step: "x", draft: sampleDraft() }),
    )

    expect(loadBuilderDraft("k", { storage })?.step).toBe(0)
  })

  it("clears a slot", () => {
    const storage = memoryStorage()
    saveBuilderDraft("k", sampleDraft(), 0, { storage })
    clearBuilderDraft("k", storage)

    expect(storage.data.has("k")).toBe(false)
  })

  it("survives storage that refuses writes or reads", () => {
    const full = {
      getItem: () => {
        throw new Error("blocked")
      },
      setItem: () => {
        throw new Error("quota")
      },
      removeItem: () => {
        throw new Error("blocked")
      },
    }

    expect(saveBuilderDraft("k", sampleDraft(), 0, { storage: full })).toBe(false)
    expect(loadBuilderDraft("k", { storage: full })).toBeUndefined()
    expect(() => clearBuilderDraft("k", full)).not.toThrow()
  })
})

describe("isRestorableDraft", () => {
  it("accepts a normal draft", () => {
    expect(isRestorableDraft(sampleDraft())).toBe(true)
    expect(isRestorableDraft(createEmptyDraft())).toBe(true)
  })

  it("rejects anything that is not a draft", () => {
    expect(isRestorableDraft(null)).toBe(false)
    expect(isRestorableDraft("draft")).toBe(false)
    expect(isRestorableDraft([])).toBe(false)
  })

  it("rejects a draft with a missing or invalid field", () => {
    const { notes: _notes, ...withoutNotes } = sampleDraft()
    expect(isRestorableDraft(withoutNotes)).toBe(false)
    expect(isRestorableDraft({ ...sampleDraft(), taxPercent: Number.NaN })).toBe(false)
    expect(isRestorableDraft({ ...sampleDraft(), bankAccountIds: [1] })).toBe(false)
  })

  it("rejects a line or a packaging row that cannot be rendered", () => {
    const draft = sampleDraft()
    expect(
      isRestorableDraft({ ...draft, lines: [{ ...draft.lines[0], packaging: null }] }),
    ).toBe(false)
    expect(
      isRestorableDraft({
        ...draft,
        lines: [
          {
            ...draft.lines[0],
            packaging: [{ ...draft.lines[0].packaging[0], packages: "19" }],
          },
        ],
      }),
    ).toBe(false)
  })

  it("rejects a delivery batch without allocations", () => {
    const draft = sampleDraft()
    expect(
      isRestorableDraft({ ...draft, delivery: [{ ...draft.delivery[0], allocations: 1 }] }),
    ).toBe(false)
  })
})

describe("sanitizeRestoredDraft", () => {
  const context = {
    customers: [{ id: "customer-1" }],
    banks: [bank("qnb"), bank("saib")],
    paymentTerms: [{ id: "term-a" }, { id: "term-b" }],
  }

  it("leaves a draft that still matches the catalogue untouched", () => {
    const draft = sampleDraft({ paymentTermId: "term-b", bankAccountIds: ["qnb"] })

    expect(sanitizeRestoredDraft(draft, context)).toEqual(draft)
  })

  it("drops a customer that no longer exists", () => {
    const draft = sampleDraft({ customerId: "gone" })

    expect(sanitizeRestoredDraft(draft, context).customerId).toBe("")
  })

  it("replaces a payment term that no longer exists with the first one", () => {
    const draft = sampleDraft({ paymentTermId: "gone" })

    expect(sanitizeRestoredDraft(draft, context).paymentTermId).toBe("term-a")
  })

  it("keeps only the bank accounts that still exist", () => {
    const draft = sampleDraft({ bankAccountIds: ["qnb", "gone"] })

    expect(sanitizeRestoredDraft(draft, context).bankAccountIds).toEqual(["qnb"])
  })

  it("falls back to the active banks when none of the selected ones exist", () => {
    const draft = sampleDraft({ bankAccountIds: ["gone"] })

    expect(sanitizeRestoredDraft(draft, context).bankAccountIds).toEqual(["qnb", "saib"])
  })

  it("respects a selection the user emptied on purpose", () => {
    const draft = sampleDraft({ bankAccountIds: [] })

    expect(sanitizeRestoredDraft(draft, context).bankAccountIds).toEqual([])
  })

  it("does not touch references when the catalogue did not load", () => {
    const draft = sampleDraft({
      customerId: "customer-9",
      paymentTermId: "term-9",
      bankAccountIds: ["x"],
    })
    const empty = { customers: [], banks: [], paymentTerms: [] }

    expect(sanitizeRestoredDraft(draft, empty)).toEqual(draft)
  })
})
