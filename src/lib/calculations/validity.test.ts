import { describe, expect, it } from "vitest"

import {
  DEFAULT_VALIDITY_DAYS,
  expiryDateFrom,
  MAX_VALIDITY_DAYS,
  normalizeValidityDays,
} from "./validity"

describe("offer validity", () => {
  it("is valid for seven days by default", () => {
    expect(DEFAULT_VALIDITY_DAYS).toBe(7)
  })

  it("adds the validity days to the issue date", () => {
    expect(expiryDateFrom("2026-12-03", 7)).toBe("2026-12-10")
    expect(expiryDateFrom("2026-12-03", 30)).toBe("2027-01-02")
  })

  it("crosses month and year boundaries", () => {
    expect(expiryDateFrom("2026-12-28", 7)).toBe("2027-01-04")
    expect(expiryDateFrom("2026-02-25", 7)).toBe("2026-03-04")
  })

  it("keeps the issue date when the validity is empty", () => {
    expect(expiryDateFrom("2026-12-03", 0)).toBe("2026-12-03")
  })

  it("returns the input untouched when the issue date is not a date", () => {
    expect(expiryDateFrom("", 7)).toBe("")
    expect(expiryDateFrom("soon", 7)).toBe("soon")
  })

  it("normalizes what is typed in the builder", () => {
    expect(normalizeValidityDays(7)).toBe(7)
    expect(normalizeValidityDays("14")).toBe(14)
    expect(normalizeValidityDays(7.9)).toBe(7)
    expect(normalizeValidityDays(-3)).toBe(0)
    expect(normalizeValidityDays("")).toBe(0)
    expect(normalizeValidityDays("abc")).toBe(0)
    expect(normalizeValidityDays(undefined)).toBe(0)
    expect(normalizeValidityDays(10_000)).toBe(MAX_VALIDITY_DAYS)
  })
})
