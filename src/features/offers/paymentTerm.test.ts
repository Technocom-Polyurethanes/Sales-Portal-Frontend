import { describe, expect, it } from "vitest"

import { buildDocumentData } from "./document"
import { findPaymentTerm, paymentTermConditions, paymentTermLabel } from "./paymentTerm"

const instalment = {
  id: "term-guid",
  code: "instalment-40-60",
  label: "40% / 60%",
  labelAr: "40% / 60% عربي",
  days: 45,
  conditions: "due {days} days after receipt",
  conditionsAr: "يستحق بعد {days} يوم",
}

describe("payment term helpers", () => {
  it("finds a catalogue term by its GUID and falls back to the built-in list", () => {
    expect(findPaymentTerm([instalment], "term-guid")).toBe(instalment)
    expect(findPaymentTerm([], "cheque-30").days).toBe(30)
  })

  it("fills the days into the conditions in the document language", () => {
    expect(paymentTermConditions(instalment, "en")).toBe("due 45 days after receipt")
    expect(paymentTermConditions(instalment, "ar")).toBe("يستحق بعد 45 يوم")
  })

  it("has no conditions when the term has none", () => {
    expect(paymentTermConditions({ ...instalment, conditions: null, conditionsAr: null }, "ar")).toBe("")
  })

  it("picks the label of the document language", () => {
    expect(paymentTermLabel(instalment, "ar")).toBe("40% / 60% عربي")
  })
})

describe("document payment conditions", () => {
  it("carries the term conditions into the printed document data", () => {
    const data = buildDocumentData(
      {
        reference: "Loc/1/YL/AA",
        issueDate: "2026-11-17",
        dueDate: "2026-12-17",
        currency: "EGP",
        lines: [],
        delivery: [],
        notes: "",
      } as any,
      {
        customer: undefined,
        company: {} as any,
        banks: [],
        packageTypes: [],
        language: "en",
        paymentTermLabel: "40% / 60%",
        paymentConditions: "due 45 days after receipt",
      },
    )
    expect(data.paymentConditions).toBe("due 45 days after receipt")
  })
})
