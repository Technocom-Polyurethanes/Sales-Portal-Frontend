import { describe, expect, it } from "vitest"

import {
  formatNumber,
  formatRelative,
  formatSize,
  formatClock,
  splitUptime,
} from "./relative"

const NOW = Date.parse("2026-11-28T12:00:00Z")

describe("status and log formatters", () => {
  it("renders uptime as days, hours and minutes", () => {
    expect(splitUptime(1_416_000)).toEqual({ days: 16, hours: 9, minutes: 20 })
    expect(splitUptime(0)).toEqual({ days: 0, hours: 0, minutes: 0 })
    expect(splitUptime(-5)).toEqual({ days: 0, hours: 0, minutes: 0 })
  })

  it("renders byte sizes in human units", () => {
    expect(formatSize(0, "en-US")).toBe("0 B")
    expect(formatSize(512, "en-US")).toBe("512 B")
    expect(formatSize(1536, "en-US")).toBe("1.5 KB")
    expect(formatSize(1_510_500_000, "en-US")).toBe("1.4 GB")
  })

  it("uses relative time for recent events and never crashes on missing data", () => {
    expect(formatRelative("2026-11-28T11:58:00Z", NOW, "en-US")).toBe(
      "2 minutes ago",
    )
    expect(formatRelative("2026-11-28T09:00:00Z", NOW, "en-US")).toBe(
      "3 hours ago",
    )
    expect(formatRelative("2026-11-25T12:00:00Z", NOW, "en-US")).toBe(
      "3 days ago",
    )
    expect(formatRelative(null, NOW, "en-US")).toBe("")
    expect(formatRelative("not a date", NOW, "en-US")).toBe("")
  })

  it("localises numbers and clocks", () => {
    expect(formatNumber(1234, "en-US")).toBe("1,234")
    expect(formatNumber(1234, "ar-EG")).toBe("١٬٢٣٤")
    const localNoon = new Date(2026, 10, 28, 9, 47, 12).toISOString()
    expect(formatClock(localNoon, "en-US")).toBe("09:47:12")
    expect(formatClock(null, "en-US")).toBe("")
  })
})
