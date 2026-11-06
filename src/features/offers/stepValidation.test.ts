import { describe, expect, it } from "vitest"

import { createEmptyDraft } from "./draft"
import {
  furthestOpenStep,
  validateAllSteps,
  validateStep,
  type StepValidationContext,
} from "./stepValidation"
import type { OfferDraft, OfferDraftLine } from "./types"

const ctx: StepValidationContext = {
  sequenceRequired: false,
  hasPaymentTerms: true,
  hasPackageTypes: true,
}

function line(patch: Partial<OfferDraftLine> = {}): OfferDraftLine {
  return {
    id: "l1",
    productId: "p1",
    materialName: "Resin",
    category: "resin",
    ratePerKg: 10,
    discountPercent: 0,
    packaging: [
      {
        id: "r1",
        packageTypeId: "drum",
        weightPerPackageKg: 200,
        packages: 2,
      } as OfferDraftLine["packaging"][number],
    ],
    ...patch,
  } as OfferDraftLine
}

function filled(patch: Partial<OfferDraft> = {}): OfferDraft {
  return {
    ...createEmptyDraft({ paymentTermId: "cheque-30" }, []),
    customerId: "c1",
    bankAccountIds: ["b1"],
    lines: [line()],
    ...patch,
  }
}

describe("step validation", () => {
  it("needs a customer, a date, a currency and payment terms on the first step", () => {
    const draft = filled({ customerId: "", issueDate: "", paymentTermId: "" })
    const fields = validateStep(0, draft, ctx).map((issue) => issue.field)
    expect(fields).toEqual(["offer-customer", "offer-date", "offer-term"])
  })

  it("does not require payment terms the catalog does not offer", () => {
    const draft = filled({ paymentTermId: "" })
    expect(validateStep(0, draft, { ...ctx, hasPaymentTerms: false })).toEqual([])
  })

  it("requires the starting number only on the first offer", () => {
    const draft = filled({ sequence: 0 })
    expect(validateStep(0, draft, ctx)).toEqual([])
    expect(
      validateStep(0, draft, { ...ctx, sequenceRequired: true }).map((i) => i.field),
    ).toEqual(["offer-sequence"])
  })

  it("needs a material with a price and complete packaging", () => {
    expect(validateStep(1, filled({ lines: [] }), ctx)).toHaveLength(1)
    expect(validateStep(1, filled(), ctx)).toEqual([])

    const noPrice = validateStep(1, filled({ lines: [line({ ratePerKg: 0 })] }), ctx)
    expect(noPrice.map((i) => i.message)).toEqual(["offers.builder.validation.rate"])
    expect(noPrice[0]?.params).toEqual({ name: "Resin" })

    const noPackaging = validateStep(1, filled({ lines: [line({ packaging: [] })] }), ctx)
    expect(noPackaging.map((i) => i.message)).toEqual([
      "offers.builder.validation.packagingMissing",
    ])

    const noCount = line()
    noCount.packaging[0]!.packages = 0
    expect(
      validateStep(1, filled({ lines: [noCount] }), ctx).map((i) => i.message),
    ).toEqual(["offers.builder.validation.packagingPackages"])
  })

  it("keeps the tax and the discount between 0 and 100", () => {
    expect(validateStep(2, filled({ taxPercent: 14, orderDiscountPercent: 10 }), ctx)).toEqual([])
    expect(validateStep(2, filled({ taxPercent: 140 }), ctx)).toHaveLength(1)
    expect(validateStep(2, filled({ orderDiscountPercent: -1 }), ctx)).toHaveLength(1)
  })

  it("treats the delivery schedule as optional but wants a date on every batch", () => {
    expect(validateStep(3, filled({ delivery: [] }), ctx)).toEqual([])
    const batch = { id: "d1", batchNumber: 2, date: "", allocations: [] }
    const issues = validateStep(3, filled({ delivery: [batch] }), ctx)
    expect(issues[0]?.params).toEqual({ number: 2 })
  })

  it("needs at least one bank account on the last step", () => {
    expect(validateStep(4, filled({ bankAccountIds: [] }), ctx)).toHaveLength(1)
    expect(validateStep(4, filled(), ctx)).toEqual([])
  })

  it("lets drafts through with only a customer, a material and a bank", () => {
    const draft = filled({ customerId: "", lines: [], bankAccountIds: [], issueDate: "" })
    const blocking = validateAllSteps(draft, ctx)
      .flat()
      .filter((issue) => issue.blocksDraft)
    expect(blocking.map((issue) => issue.message)).toEqual([
      "offers.builder.validation.customer",
      "offers.builder.validation.lines",
      "offers.builder.banks.required",
    ])
  })

  it("stops at the first incomplete step and opens everything once all are complete", () => {
    expect(furthestOpenStep(validateAllSteps(filled({ customerId: "" }), ctx))).toBe(0)
    expect(furthestOpenStep(validateAllSteps(filled({ lines: [] }), ctx))).toBe(1)
    expect(furthestOpenStep(validateAllSteps(filled(), ctx))).toBe(4)
  })
})
