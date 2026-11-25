import { describe, expect, it } from "vitest"

import type { Customer } from "../customers/types"
import { calculateDraft } from "./calculations"
import { offerToDraft } from "./draft"
import { mapOfferDetail } from "./mappers"

/** A stored offer as the API sends it: lines carry ids only, the names live in `document`. */
const apiOffer = () =>
  mapOfferDetail({
    id: "offer-1",
    reference: "Loc/1/YL/AA",
    customerId: "customer-1",
    issueDate: "2026-11-17",
    dueDate: "2026-11-17",
    paymentTermId: "bank-transfer-purchase-order",
    documentLanguage: "En",
    taxPercent: 14,
    lines: [
      {
        id: "line-1",
        materialId: "material-1",
        ratePerKg: 168,
        discountPercent: 0,
        packaging: [
          { id: "row-1", packageTypeId: "type-1", weightPerPackageKg: 210, packages: 2 },
        ],
      },
    ],
    deliveryBatches: [
      {
        id: "batch-1",
        batchNumber: 1,
        deliveryDate: "2026-11-25",
        allocations: [
          {
            offerLineId: "line-1",
            offerLinePackagingId: "row-1",
            materialId: "material-1",
            packageTypeId: "type-1",
            packages: 2,
          },
        ],
      },
    ],
    document: {
      items: [
        {
          offerLineId: "line-1",
          materialId: "material-1",
          materialName: "POLYOL TECHNOFOAM A 01 - HFC",
          materialCode: "PTA-01",
          category: "Polyol",
          packaging: [{ packageTypeId: "type-1", packageTypeName: "Drum" }],
        },
      ],
    },
  })

describe("offerToDraft for a new version", () => {
  it("takes the item names from the stored document when no catalogue is given", () => {
    const draft = offerToDraft(apiOffer())
    const [line] = draft.lines

    expect(line.materialName).toBe("POLYOL TECHNOFOAM A 01 - HFC")
    expect(line.materialCode).toBe("PTA-01")
    expect(line.category).toBe("Polyol")
    expect(line.packaging[0].packageTypeName).toBe("Drum")
  })

  it("prefers the current catalogue over the stored document", () => {
    const draft = offerToDraft(apiOffer(), [], {
      products: [
        {
          id: "material-1",
          code: "PTA-02",
          name: "POLYOL TECHNOFOAM A 01 - HFC (renamed)",
          category: "Polyol",
          defaultPackageTypeId: "type-1",
          defaultWeightKg: 210,
          referencePrice: 0,
        },
      ],
      packageTypes: [
        { id: "type-1", name: "Barrel", nameAr: "برميل", defaultWeightKg: 210, sizesKg: [210] },
      ],
    })
    const [line] = draft.lines

    expect(line.materialName).toBe("POLYOL TECHNOFOAM A 01 - HFC (renamed)")
    expect(line.materialCode).toBe("PTA-02")
    expect(line.packaging[0].packageTypeName).toBe("Barrel")
  })

  it("keeps the amount: quantity times rate from the stored packaging", () => {
    const calculations = calculateDraft(offerToDraft(apiOffer()))

    expect(calculations.lines[0].quantityKg).toBe(420)
    expect(calculations.lines[0].amount).toBe(70560)
  })

  it("links the delivery allocations to the copied packaging rows", () => {
    const draft = offerToDraft(apiOffer())
    const [allocation] = draft.delivery[0].allocations

    expect(allocation.productId).toBe("material-1")
    expect(allocation.packagingRowId).toBe(draft.lines[0].packaging[0].id)
    expect(allocation.packagingRowId).not.toBe("row-1")
  })

  it("keeps the price per kg of every line", () => {
    const draft = offerToDraft(apiOffer())

    expect(draft.lines[0].ratePerKg).toBe(168)
  })

  it("prefills attention from the customer when the source offer left it blank", () => {
    const customer = {
      id: "customer-1",
      contactPerson: "Nader William",
      contactPersonAr: "نادر وليام",
    } as Customer

    const draft = offerToDraft(apiOffer(), [], { customers: [customer] })

    expect(draft.attention).toBe("Nader William")
    expect(draft.attentionAr).toBe("نادر وليام")
  })

  it("keeps an attention name already stored on the source offer", () => {
    const source = apiOffer()
    source.attention = "Mostafa Fouad"
    source.attentionAr = "مصطفى فؤاد"
    const customer = {
      id: "customer-1",
      contactPerson: "Nader William",
      contactPersonAr: "نادر وليام",
    } as Customer

    const draft = offerToDraft(source, [], { customers: [customer] })

    expect(draft.attention).toBe("Mostafa Fouad")
    expect(draft.attentionAr).toBe("مصطفى فؤاد")
  })
})
