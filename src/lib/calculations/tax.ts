import { normalizePercent, roundMoney } from "./round"

/**
 * The commercial and industrial profit tax is a fixed 1% deduction. The
 * builder never asks for a name or a rate, it only toggles it on and off.
 */
export const OTHER_TAX_PERCENT = 1

export type TotalsInput = {
  /** Sum of every priced line before taxes. */
  subtotal: number
  /** Percentage added on top of the subtotal. */
  taxPercent: number
  /** Percentage subtracted from the total (a deduction such as a rebate). */
  otherTaxPercent?: number
  /** Whether the "other tax / deduction" row is enabled at all. */
  otherTaxEnabled?: boolean
  /** Amount already paid by the customer. */
  advancePayment?: number
  /** Order level discount percentage applied before taxes. */
  orderDiscountPercent?: number
  /** Extra expenses added before taxes. */
  extraExpenses?: number
}

export type Totals = {
  subtotal: number
  taxPercent: number
  taxAmount: number
  otherTaxPercent: number
  otherTaxAmount: number
  /** Order level discount percentage. */
  orderDiscountPercent: number
  /** Order level discount amount. */
  orderDiscount: number
  extraExpenses: number
  netBeforeTax?: number
  total: number
  advancePayment: number
  balanceDue: number
}

/** Tax added on top of the subtotal. */
export function calculateTax(subtotal: number, percent: number): number {
  const base = Number.isFinite(subtotal) ? subtotal : 0
  return roundMoney((base * normalizePercent(percent)) / 100)
}

/**
 * The "other tax" row is a deduction: it is calculated from the subtotal and
 * subtracted from the total.
 */
export function calculateOtherTax(subtotal: number, percent: number): number {
  const base = Number.isFinite(subtotal) ? subtotal : 0
  return roundMoney((base * normalizePercent(percent)) / 100)
}

/**
 * Builds the full totals block of an offer.
 *
 * total = subtotal - discount + expenses + tax - otherTax
 * balance = total - advance
 */
export function calculateTotals(input: TotalsInput): Totals {
  const subtotal = roundMoney(input.subtotal)
  const taxPercent = normalizePercent(input.taxPercent)
  const otherTaxPercent = input.otherTaxEnabled
    ? normalizePercent(input.otherTaxPercent ?? 0)
    : 0
  const orderDiscountPercent = normalizePercent(input.orderDiscountPercent ?? 0)
  const orderDiscount = roundMoney((subtotal * orderDiscountPercent) / 100)
  const extraExpenses = roundMoney(input.extraExpenses ?? 0)
  const advancePayment = roundMoney(input.advancePayment ?? 0)

  const netBeforeTax = roundMoney(subtotal - orderDiscount + extraExpenses)
  const taxAmount = calculateTax(netBeforeTax, taxPercent)
  const otherTaxAmount = calculateOtherTax(netBeforeTax, otherTaxPercent)

  const total = roundMoney(netBeforeTax + taxAmount - otherTaxAmount)

  return {
    subtotal,
    taxPercent,
    taxAmount,
    otherTaxPercent,
    otherTaxAmount,
    orderDiscountPercent,
    orderDiscount,
    extraExpenses,
    netBeforeTax,
    total,
    advancePayment,
    balanceDue: roundMoney(total - advancePayment),
  }
}
