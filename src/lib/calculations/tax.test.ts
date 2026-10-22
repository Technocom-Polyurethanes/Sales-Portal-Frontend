import { describe, expect, it } from "vitest"

import { calculateOtherTax, calculateTax, calculateTotals } from "./tax"

describe("tax calculations", () => {
  it("adds tax on top of the subtotal", () => {
    expect(calculateTax(100_000, 14)).toBe(14_000)
  })

  it("returns no tax for a zero or negative percentage", () => {
    expect(calculateTax(100_000, 0)).toBe(0)
    expect(calculateTax(100_000, -5)).toBe(0)
  })

  it("calculates the other tax from the subtotal", () => {
    expect(calculateOtherTax(100_000, 1)).toBe(1_000)
  })

  it("matches the default sample calculation", () => {
    const totals = calculateTotals({
      subtotal: 100_000,
      taxPercent: 14,
      otherTaxPercent: 1,
      otherTaxEnabled: true,
    })

    expect(totals.subtotal).toBe(100_000)
    expect(totals.taxAmount).toBe(14_000)
    expect(totals.otherTaxAmount).toBe(1_000)
    expect(totals.total).toBe(113_000)
    expect(totals.balanceDue).toBe(113_000)
  })

  it("subtracts the advance payment from the balance", () => {
    const totals = calculateTotals({
      subtotal: 100_000,
      taxPercent: 14,
      otherTaxPercent: 1,
      otherTaxEnabled: true,
      advancePayment: 13_000,
    })

    expect(totals.total).toBe(113_000)
    expect(totals.balanceDue).toBe(100_000)
  })

  it("ignores the other tax when it is disabled", () => {
    const totals = calculateTotals({
      subtotal: 100_000,
      taxPercent: 14,
      otherTaxPercent: 1,
      otherTaxEnabled: false,
    })

    expect(totals.otherTaxAmount).toBe(0)
    expect(totals.total).toBe(114_000)
  })

  it("applies the order discount and extra expenses", () => {
    const totals = calculateTotals({
      subtotal: 100_000,
      taxPercent: 0,
      orderDiscount: 5_000,
      extraExpenses: 2_500,
    })

    expect(totals.total).toBe(97_500)
  })

  it("rounds money to two decimals", () => {
    const totals = calculateTotals({ subtotal: 1_000.005, taxPercent: 14 })
    expect(totals.taxAmount).toBe(140.0)
    expect(totals.total).toBe(1140.01)
  })
})
