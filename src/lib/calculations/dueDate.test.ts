import { describe, expect, it } from "vitest"

import { dueDateFrom, getPaymentTerm, PAYMENT_TERMS } from "./dueDate"

describe("due date calculation", () => {
  it("keeps the issue date for terms due on delivery", () => {
    expect(dueDateFrom("2026-10-21", "bank-transfer-purchase-order")).toBe(
      "2026-10-21",
    )
    expect(dueDateFrom("2026-10-21", "cash-on-delivery")).toBe("2026-10-21")
  })

  it("adds the payment term days to the issue date", () => {
    expect(dueDateFrom("2026-10-21", "cheque-30")).toBe("2026-11-20")
    expect(dueDateFrom("2026-10-21", "cheque-60")).toBe("2026-12-20")
  })

  it("crosses month and year boundaries", () => {
    expect(dueDateFrom("2026-12-10", "cheque-30")).toBe("2027-01-09")
    expect(dueDateFrom("2026-02-25", "cheque-30")).toBe("2026-03-27")
  })

  it("accepts a payment term object", () => {
    const term = getPaymentTerm("cheque-30")
    expect(dueDateFrom("2026-10-21", term)).toBe("2026-11-20")
  })

  it("falls back to the first term for an unknown id", () => {
    expect(getPaymentTerm("unknown").id).toBe(PAYMENT_TERMS[0].id)
  })

  it("returns the issue date untouched when it is invalid", () => {
    expect(dueDateFrom("not-a-date", "cheque-30")).toBe("not-a-date")
  })
})
