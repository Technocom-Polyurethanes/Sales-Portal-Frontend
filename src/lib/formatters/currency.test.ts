import { describe, expect, it } from "vitest"

import { formatCurrencyLabel } from "./currency"
import { formatCurrency } from "./number"

describe("currency labels", () => {
  it("keeps the ISO code in English", () => {
    expect(formatCurrencyLabel("EGP", "en-US")).toBe("EGP")
    expect(formatCurrencyLabel("USD", "en-US")).toBe("USD")
  })

  it("uses the local abbreviation in Arabic", () => {
    expect(formatCurrencyLabel("EGP", "ar-EG")).toBe("ج.م")
    expect(formatCurrencyLabel("USD", "ar-EG")).toBe("دولار")
  })

  it("falls back to the code for an unknown currency", () => {
    expect(formatCurrencyLabel("XYZ", "ar-EG")).toBe("XYZ")
  })

  it("appends the localized label to an amount", () => {
    expect(formatCurrency(113000, "EGP", "en-US")).toBe("113,000.00 EGP")
    expect(formatCurrency(113000, "EGP", "ar-EG")).toBe("113,000.00 ج.م")
  })
})
