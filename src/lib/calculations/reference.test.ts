import { describe, expect, it } from "vitest"

import {
  buildOfferReference,
  nextReferenceSequence,
  parseReference,
  referenceSequence,
  resolveInitials,
} from "./reference"

describe("offer reference numbers", () => {
  it("builds type / padded sequence-issue year / YL / initials", () => {
    expect(buildOfferReference("Loc", 378, "JD", "2026-11-23")).toBe(
      "Loc/0378-2026/YL/JD",
    )
    expect(buildOfferReference("Int", 43, "jd", "2027-01-05")).toBe(
      "Int/0043-2027/YL/JD",
    )
  })

  it("keeps every letter of the initials", () => {
    expect(buildOfferReference("Loc", 1, "ABC", "2026-11-23")).toBe(
      "Loc/0001-2026/YL/ABC",
    )
  })

  it("parses a reference back into its parts", () => {
    expect(parseReference("Int/0043-2027/YL/jd")).toEqual({
      offerType: "Int",
      sequence: 43,
      year: 2027,
      initials: "JD",
    })
    expect(parseReference("Loc/42/YL/JD")).toEqual({
      offerType: "Loc",
      sequence: 42,
      year: 0,
      initials: "JD",
    })
    expect(parseReference("3089/OCT./YL/AA")).toBeNull()
  })

  it("reads the sequence of new and legacy references", () => {
    expect(referenceSequence("Loc/0377-2026/YL/AA")).toBe(377)
    expect(referenceSequence("Loc/42/YL/JD")).toBe(42)
    expect(referenceSequence("3089/OCT./YL/AA")).toBe(3089)
    expect(referenceSequence("nonsense")).toBeNull()
  })

  it("resolves initials from the user", () => {
    expect(resolveInitials("j.d", "John Doe")).toBe("JD")
    expect(resolveInitials("", "John Doe")).toBe("JD")
    expect(resolveInitials(undefined, undefined)).toBe("NA")
  })

  it("increments the sequence for the next offer", () => {
    expect(nextReferenceSequence(3089)).toBe(3090)
  })
})
