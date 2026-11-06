import { describe, expect, it } from "vitest"

import {
  buildOfferReference,
  nextReferenceSequence,
  parseReference,
  referenceSequence,
  resolveInitials,
} from "./reference"

describe("offer reference numbers", () => {
  it("builds type / sequence / YL / initials", () => {
    expect(buildOfferReference("Loc", 42, "JD")).toBe("Loc/42/YL/JD")
    expect(buildOfferReference("Int", 43, "jd")).toBe("Int/43/YL/JD")
  })

  it("keeps every letter of the initials", () => {
    expect(buildOfferReference("Loc", 1, "ABC")).toBe("Loc/1/YL/ABC")
  })

  it("parses a reference back into its parts", () => {
    expect(parseReference("Int/43/YL/JD")).toEqual({
      offerType: "Int",
      sequence: 43,
      initials: "JD",
    })
    expect(parseReference("3089/OCT./YL/AA")).toBeNull()
  })

  it("reads the sequence of new and legacy references", () => {
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
