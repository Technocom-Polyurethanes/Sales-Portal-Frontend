import { describe, expect, it } from "vitest"

import { buildDocumentData } from "./document"
import {
  findPaymentTerm,
  nextPaymentTermsText,
  paymentTermConditions,
  paymentTermLabel,
} from "./paymentTerm"

const instalment = {
  id: "term-guid",
  code: "instalment-40-60",
  label: "40% / 60%",
  labelAr: "40% / 60% عربي",
  days: 45,
  conditions: "due {days} days after receipt",
  conditionsAr: "يستحق بعد {days} يوم",
}

const noConditions = {
  id: "term-plain",
  code: "cheque-30",
  label: "Cheque — 30 days",
  labelAr: "شيك — ٣٠ يوم",
  days: 30,
  conditions: null,
  conditionsAr: null,
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
    expect(paymentTermConditions(noConditions, "ar")).toBe("")
  })

  it("picks the label of the document language", () => {
    expect(paymentTermLabel(instalment, "ar")).toBe("40% / 60% عربي")
  })
})

describe("nextPaymentTermsText", () => {
  it("fills the default conditions when a term is selected and the text is unedited", () => {
    expect(
      nextPaymentTermsText({
        current: "",
        previousTerm: noConditions,
        previousLanguage: "en",
        nextTerm: instalment,
        nextLanguage: "en",
      }),
    ).toBe("due 45 days after receipt")
  })

  it("switches to the default in the new language when the text is still the previous default", () => {
    expect(
      nextPaymentTermsText({
        current: "due 45 days after receipt",
        previousTerm: instalment,
        previousLanguage: "en",
        nextTerm: instalment,
        nextLanguage: "ar",
      }),
    ).toBe("يستحق بعد 45 يوم")
  })

  it("keeps a custom text untouched when the language or the term changes", () => {
    expect(
      nextPaymentTermsText({
        current: "Custom payment wording for this offer",
        previousTerm: instalment,
        previousLanguage: "en",
        nextTerm: instalment,
        nextLanguage: "ar",
      }),
    ).toBe("Custom payment wording for this offer")

    expect(
      nextPaymentTermsText({
        current: "Custom payment wording for this offer",
        previousTerm: instalment,
        previousLanguage: "en",
        nextTerm: noConditions,
        nextLanguage: "en",
      }),
    ).toBe("Custom payment wording for this offer")
  })

  it("empties an unedited default when switching to a term with no conditions", () => {
    expect(
      nextPaymentTermsText({
        current: "due 45 days after receipt",
        previousTerm: instalment,
        previousLanguage: "en",
        nextTerm: noConditions,
        nextLanguage: "en",
      }),
    ).toBe("")
  })
})

describe("document payment conditions", () => {
  it("carries the offer payment conditions text into the printed document data", () => {
    const data = buildDocumentData(
      {
        reference: "Loc/1/YL/AA",
        issueDate: "2026-11-17",
        dueDate: "2026-12-17",
        currency: "EGP",
        paymentTermId: "term-guid",
        customerId: "cust-1",
        lines: [],
        subtotal: 0,
        orderDiscountPercent: 0,
        orderDiscount: 0,
        taxPercent: 14,
        taxAmount: 0,
        otherTaxEnabled: false,
        otherTaxPercent: 0,
        otherTaxAmount: 0,
        total: 0,
        delivery: [],
        paymentTermsText: "due 45 days after receipt",
        notes: "",
      },
      {
        customer: undefined,
        company: {
          name: "TECHNOCOM",
          nameAr: "شركة تكنوكوم",
          tagline: "",
          taglineAr: "",
          formCode: "TF-06-01",
          referencePrefix: "YL",
          address: "",
          phone: "",
          email: "",
          logoWidthMm: 55,
          logoHeightMm: 25,
        },
        banks: [],
        packageTypes: [],
        language: "en",
        paymentTermLabel: "40% / 60%",
      },
    )
    expect(data.paymentTermsText).toBe("due 45 days after receipt")
  })
})
