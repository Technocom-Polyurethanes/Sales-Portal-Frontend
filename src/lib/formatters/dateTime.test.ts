import { describe, expect, it } from "vitest"

import {
  formatDateTime,
  formatIsoDay,
  formatTimestampDay,
  localizeTypedDates,
} from "./date"

describe("formatIsoDay", () => {
  it("keeps the English day/month/year order and switches Arabic to year/month/day", () => {
    expect(formatIsoDay("2026-11-23")).toBe("23/11/2026")
    expect(formatIsoDay("2026-11-23", "en-US")).toBe("23/11/2026")
    expect(formatIsoDay("2026-11-23", "ar-EG")).toBe("2026/11/23")
  })
})

describe("formatDateTime", () => {
  it("shows a plain day without a time", () => {
    expect(formatDateTime("2026-10-21")).toBe("21/10/2026")
    expect(formatDateTime("2026-11-23", "ar-EG")).toBe("2026/11/23")
  })

  it("shows day and time for a timestamp in the local time zone", () => {
    const local = new Date(2026, 9, 21, 14, 5)
    expect(formatDateTime(local.toISOString())).toBe("21/10/2026 14:05")
    expect(formatTimestampDay(local.toISOString())).toBe("21/10/2026")
    expect(formatDateTime(local.toISOString(), "ar-EG")).toBe("2026/10/21 14:05")
    expect(formatTimestampDay(local.toISOString(), "ar-EG")).toBe("2026/10/21")
  })

  it("is empty for a missing value and returns an unreadable one unchanged", () => {
    expect(formatDateTime(undefined)).toBe("")
    expect(formatDateTime(null)).toBe("")
    expect(formatDateTime("not a date")).toBe("not a date")
  })
})

describe("localizeTypedDates", () => {
  it("flips both orders for Arabic", () => {
    expect(localizeTypedDates("until 28/11/2026", "ar-EG")).toBe("until 2026/11/28")
    expect(localizeTypedDates("until 2026/11/28", "ar-EG")).toBe("until 2026/11/28")
  })

  it("flips a year-first date for English", () => {
    expect(localizeTypedDates("until 2026/11/28")).toBe("until 28/11/2026")
  })

  it("passes other text through unchanged", () => {
    expect(localizeTypedDates("Form TF-06-01, code 14:05, day 3", "ar-EG")).toBe(
      "Form TF-06-01, code 14:05, day 3",
    )
  })

  it("leaves an invalid date unchanged", () => {
    expect(localizeTypedDates("31/13/2026", "ar-EG")).toBe("31/13/2026")
  })
})
