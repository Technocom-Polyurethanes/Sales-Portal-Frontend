import { describe, expect, it } from "vitest"

import {
  formatClock,
  formatNumber,
  formatRelative,
  formatSize,
  splitUptime,
} from "../../../lib/formatters/relative"
import { uptimeText } from "../components/insight"

const NOW = Date.parse("2026-11-28T10:00:00.000Z")

describe("system status formatting", () => {
  it("splits uptime into days, hours and minutes", () => {
    expect(splitUptime(1_416_240)).toEqual({ days: 16, hours: 9, minutes: 24 })
    expect(splitUptime(-5)).toEqual({ days: 0, hours: 0, minutes: 0 })
    expect(uptimeText(1_416_240, (key) => key.split(".").pop() ?? key)).toBe(
      "16d 9h 24m",
    )
  })

  it("formats byte sizes and counts for the active locale", () => {
    expect(formatSize(1_510_500_000, "en-US")).toContain("GB")
    expect(formatSize(null, "en-US")).toBe("0 B")
    expect(formatNumber(1234, "en-US")).toBe("1,234")
  })

  it("formats relative timestamps and an empty timestamp safely", () => {
    expect(formatRelative("2026-11-28T09:58:00.000Z", NOW, "en-US")).toBe(
      "2 minutes ago",
    )
    expect(formatRelative("2026-11-28T09:00:00.000Z", NOW, "en-US")).toBe(
      "1 hour ago",
    )
    expect(formatRelative(null, NOW, "en-US")).toBe("")
    expect(formatRelative("not-a-date", NOW, "en-US")).toBe("")
  })

  it("formats the checked-at clock", () => {
    expect(formatClock("2026-11-28T10:00:00.000Z", "en-US")).toMatch(
      /^\d{2}:\d{2}:\d{2}$/,
    )
    expect(formatClock(undefined, "en-US")).toBe("")
  })
})
