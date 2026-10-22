import { describe, expect, it } from "vitest"

import {
  monthAbbreviation,
  nextReferenceSequence,
  referenceNumber,
  referencePreview,
} from "./reference"

describe("offer reference numbers", () => {
  it("takes the month from the issue date", () => {
    expect(referenceNumber(3089, "2026-10-21")).toBe("3089/OCT./YL/AA")
    expect(referenceNumber(3090, "2026-11-05")).toBe("3090/NOV./YL/AA")
    expect(referenceNumber(1, "2026-01-09")).toBe("1/JAN./YL/AA")
    expect(referenceNumber(1, "2026-12-31")).toBe("1/DEC./YL/AA")
  })

  it("exposes the month abbreviation on its own", () => {
    expect(monthAbbreviation("2026-07-15")).toBe("JUL.")
    expect(monthAbbreviation("invalid")).toBe("JAN.")
  })

  it("increments the sequence for the next offer", () => {
    expect(nextReferenceSequence(3089)).toBe(3090)
  })

  it("builds a preview of the reference for a date", () => {
    expect(referencePreview(3089, "2026-10-21")).toBe(
      "2026-10-21 → 3089/OCT./YL/AA",
    )
  })

  it("keeps the same month for every day of that month", () => {
    expect(referenceNumber(3089, "2026-10-01")).toBe("3089/OCT./YL/AA")
    expect(referenceNumber(3089, "2026-10-31")).toBe("3089/OCT./YL/AA")
  })
})
