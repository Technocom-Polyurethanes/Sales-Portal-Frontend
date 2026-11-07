import { describe, expect, it } from "vitest"

import { formatDateTime, formatTimestampDay } from "./date"

describe("formatDateTime", () => {
  it("shows a plain day without a time", () => {
    expect(formatDateTime("2026-10-21")).toBe("21/10/2026")
  })

  it("shows day and time for a timestamp in the local time zone", () => {
    const local = new Date(2026, 9, 21, 14, 5)
    expect(formatDateTime(local.toISOString())).toBe("21/10/2026 14:05")
    expect(formatTimestampDay(local.toISOString())).toBe("21/10/2026")
  })

  it("is empty for a missing value and returns an unreadable one unchanged", () => {
    expect(formatDateTime(undefined)).toBe("")
    expect(formatDateTime(null)).toBe("")
    expect(formatDateTime("not a date")).toBe("not a date")
  })
})
