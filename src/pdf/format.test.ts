import { describe, expect, it } from "vitest"

import { formatDocumentDate, formatDocumentMoney, formatDocumentNumber } from "./format"

describe("formatDocumentNumber", () => {
  it("keeps English thousands separators", () => {
    expect(formatDocumentNumber(236518.89, "en")).toBe("236,518.89")
  })

  it("uses only a dot and no thousands separator in Arabic", () => {
    expect(formatDocumentNumber(236518.89, "ar")).toBe("236518.89")
    expect(formatDocumentNumber(39900, "ar")).toBe("39900")
  })
})

describe("formatDocumentMoney", () => {
  it("always prints two decimals, even for whole amounts", () => {
    expect(formatDocumentMoney(39900, "en")).toBe("39,900.00")
    expect(formatDocumentMoney(10, "en")).toBe("10.00")
    expect(formatDocumentMoney(236518.89, "en")).toBe("236,518.89")
  })

  it("keeps the Arabic dot decimal with no thousands separator", () => {
    expect(formatDocumentMoney(39900, "ar")).toBe("39900.00")
    expect(formatDocumentMoney(236518.89, "ar")).toBe("236518.89")
  })
})

describe("formatDocumentDate", () => {
  it("keeps English day/month/year and switches Arabic to year/month/day", () => {
    expect(formatDocumentDate("2026-11-23", "en")).toBe("23/11/2026")
    expect(formatDocumentDate("2026-11-23", "ar")).toBe("2026/11/23")
  })
})
