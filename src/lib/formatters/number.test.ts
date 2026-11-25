import { describe, expect, it } from "vitest"

import { formatCompactNumber, formatNumber } from "./number"

describe("number formatting", () => {
  it("keeps English grouping and decimals", () => {
    expect(formatNumber(236518.89, "en-US")).toBe("236,518.89")
    expect(formatCompactNumber(236518.89, "en-US")).toBe("236,518.89")
  })

  it("uses only a dot and no thousands separator in Arabic", () => {
    expect(formatNumber(236518.89, "ar-EG")).toBe("236518.89")
    expect(formatCompactNumber(236518.89, "ar-EG")).toBe("236518.89")
    expect(formatNumber(39900, "ar-EG")).toBe("39900.00")
  })
})
