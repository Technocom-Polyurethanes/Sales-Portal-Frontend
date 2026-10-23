import { describe, expect, it } from "vitest"

import {
  calculateDraft,
  draftLineAmount,
  orderedPackages,
} from "./calculations"
import { createDraftLine, createEmptyDraft } from "./draft"
import type { Product } from "../products/types"
import type { PackageType } from "../settings/types"

const packageTypes: PackageType[] = [
  {
    id: "drum",
    name: "Drum",
    nameAr: "برميل",
    defaultWeightKg: 210,
    sizesKg: [200, 210, 220, 250],
  },
  {
    id: "pail",
    name: "Pail",
    nameAr: "علبة",
    defaultWeightKg: 25,
    sizesKg: [20, 25, 30],
  },
]

const product: Product = {
  id: "prod-1",
  code: "POL-001",
  name: "DALTORIM EG 26200 - D",
  category: "Polyol",
  defaultPackageTypeId: "drum",
  defaultWeightKg: 210,
  availableSizesKg: [200, 210, 220, 250],
  referencePrice: 10,
}

describe("offer draft calculations", () => {
  it("computes the quantity of a mixed packaging line", () => {
    const line = createDraftLine(product, packageTypes)
    line.packaging[0].packages = 19

    const draft = createEmptyDraft({ lines: [line] })
    const calculations = calculateDraft(draft)

    expect(calculations.lines[0].quantityKg).toBe(3990)
    expect(calculations.lines[0].packages).toBe(19)
  })

  it("adds the amount of every packaging row", () => {
    const line = createDraftLine(product, packageTypes)
    line.packaging = [
      { ...line.packaging[0], id: "a", weightPerPackageKg: 250, packages: 10 },
      {
        ...line.packaging[0],
        id: "b",
        packageTypeId: "pail",
        packageTypeName: "Pail",
        weightPerPackageKg: 25,
        packages: 4,
      },
    ]

    const draft = createEmptyDraft({ lines: [line] })
    const calculations = calculateDraft(draft)

    expect(calculations.lines[0].quantityKg).toBe(2600)
    expect(calculations.lines[0].amount).toBe(26000)
    expect(calculations.subtotal).toBe(26000)
  })

  it("applies the line discount on the amount", () => {
    const line = createDraftLine(product, packageTypes)
    line.packaging[0].packages = 10
    line.ratePerKg = 10
    line.discountPercent = 10

    expect(draftLineAmount(line)).toBe(18900)
  })

  it("always deducts 1% for the commercial tax", () => {
    const line = createDraftLine(product, packageTypes)
    line.packaging[0].packages = 100
    line.ratePerKg = 10

    const draft = createEmptyDraft({
      lines: [line],
      taxPercent: 14,
      otherTaxEnabled: true,
      otherTaxPercent: 5,
    })
    const calculations = calculateDraft(draft)

    expect(calculations.subtotal).toBe(210000)
    expect(calculations.totals.taxAmount).toBe(29400)
    expect(calculations.totals.otherTaxPercent).toBe(1)
    expect(calculations.totals.otherTaxAmount).toBe(2100)
    expect(calculations.totals.total).toBe(237300)
  })

  it("keeps the reference typed by the user", () => {
    const draft = createEmptyDraft({
      reference: "3090/OCT./YL/AA",
      issueDate: "2026-10-21",
      paymentTermId: "cheque-30",
    })
    const calculations = calculateDraft(draft)

    expect(calculations.reference).toBe("3090/OCT./YL/AA")
    expect(calculations.dueDate).toBe("2026-11-20")
  })

  it("tracks the scheduled and the remaining packages", () => {
    const line = createDraftLine(product, packageTypes)
    line.packaging[0].packages = 19

    const draft = createEmptyDraft({
      lines: [line],
      delivery: [
        {
          id: "batch-1",
          batchNumber: 1,
          date: "2026-10-25",
          allocations: [{ productId: "prod-1", packages: 10 }],
        },
      ],
    })
    const calculations = calculateDraft(draft)

    expect(calculations.scheduled["prod-1"]).toBe(10)
    expect(calculations.remaining["prod-1"]).toBe(9)
  })

  it("derives the weight of one package for the delivery schedule", () => {
    const line = createDraftLine(product, packageTypes)
    line.packaging[0].packages = 19

    const draft = createEmptyDraft({ lines: [line] })
    const calculations = calculateDraft(draft)

    expect(orderedPackages(draft.lines, "prod-1")).toBe(19)
    expect(calculations.weightPerPackage["prod-1"]).toBe(210)
  })
})
