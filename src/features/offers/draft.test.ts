import { describe, expect, it } from "vitest"

import { createEmptyDraft, draftId, draftToPayload, offerToDraft } from "./draft"
import { mapOfferDetail } from "./mappers"

describe("draftToPayload", () => {
  it("never sends a status and maps the draft to the API shape", () => {
    const lineId = draftId("line")
    const rowId = draftId("pack")
    const draft = createEmptyDraft({
      reference: " 1/OCT./YL/AA ",
      customerId: "c1",
      documentLanguage: "ar",
      lines: [
        {
          id: lineId,
          productId: "m1",
          materialName: "Polyol",
          category: "Polyol",
          ratePerKg: 10,
          discountPercent: 0,
          packaging: [
            {
              id: rowId,
              packageTypeId: "t1",
              packageTypeName: "Drum",
              weightPerPackageKg: 200,
              packages: 5,
            },
          ],
        },
      ],
      delivery: [
        {
          id: draftId("batch"),
          batchNumber: 1,
          date: "2026-11-01",
          allocations: [
            { productId: "m1", packagingRowId: rowId, packageTypeId: "t1", packages: 5 },
            { productId: "m1", packagingRowId: rowId, packageTypeId: "t1", packages: 0 },
          ],
        },
      ],
    })

    const payload = draftToPayload(draft, { version: 2 })

    expect(payload).not.toHaveProperty("status")
    expect(payload.reference).toBe("1/OCT./YL/AA")
    expect(payload.documentLanguage).toBe("Ar")
    expect(payload.version).toBe(2)
    expect(payload.lines[0].materialId).toBe("m1")
    expect(payload.deliveryBatches[0].allocations).toEqual([
      {
        offerLineId: lineId,
        offerLinePackagingId: rowId,
        materialId: "m1",
        packageTypeId: "t1",
        packages: 5,
      },
    ])
    expect(draftId("x")).toMatch(/^[0-9a-f-]{36}$/)
  })

  it("sends the Arabic attention and the validity days", () => {
    const draft = createEmptyDraft({
      attention: "Ahmed",
      attentionAr: " أحمد ",
      validityDays: 14.9,
    })

    const payload = draftToPayload(draft, { version: 1 })

    expect(payload.attention).toBe("Ahmed")
    expect(payload.attentionAr).toBe("أحمد")
    expect(payload.validityDays).toBe(14)
  })
})

describe("delivery modes and text blocks", () => {
  const batch = {
    id: "00000000-0000-4000-8000-000000000001",
    batchNumber: 1,
    date: "2026-11-01",
    allocations: [],
  }

  it("sends the schedule in batches mode and drops any leftover delivery text", () => {
    const payload = draftToPayload(
      createEmptyDraft({
        deliveryMode: "batches",
        delivery: [batch],
        deliveryText: "left over",
      }),
      { version: 1 },
    )

    expect(payload.deliveryMode).toBe("Batches")
    expect(payload.deliveryText).toBe("")
    expect(payload.deliveryBatches).toHaveLength(1)
  })

  it("sends the text and no batches in text mode", () => {
    const payload = draftToPayload(
      createEmptyDraft({
        deliveryMode: "text",
        delivery: [batch],
        deliveryText: "  Ready stock.  ",
      }),
      { version: 1 },
    )

    expect(payload.deliveryMode).toBe("Text")
    expect(payload.deliveryText).toBe("Ready stock.")
    expect(payload.deliveryBatches).toEqual([])
  })

  it("sends the trimmed delivery place and payment conditions", () => {
    const payload = draftToPayload(
      createEmptyDraft({
        deliveryPlace: " Our factories in Badr City. ",
        paymentTermsText: " Line one\nLine two ",
      }),
      { version: 1 },
    )

    expect(payload.deliveryPlace).toBe("Our factories in Badr City.")
    expect(payload.paymentTermsText).toBe("Line one\nLine two")
  })

  it("starts a new draft with batches and empty text blocks", () => {
    const draft = createEmptyDraft()

    expect(draft.deliveryMode).toBe("batches")
    expect(draft.deliveryText).toBe("")
    expect(draft.deliveryPlace).toBe("")
    expect(draft.paymentTermsText).toBe("")
  })

  it("reads the API delivery mode and treats offers saved before it as batches", () => {
    expect(mapOfferDetail({ deliveryMode: "Text", lines: [] }).deliveryMode).toBe("text")
    expect(mapOfferDetail({ deliveryMode: "Batches", lines: [] }).deliveryMode).toBe("batches")

    const legacy = mapOfferDetail({ lines: [] })
    expect(legacy.deliveryMode).toBe("batches")
    expect(legacy.deliveryPlace).toBe("")
    expect(legacy.paymentTermsText).toBe("")
  })

  it("restores the text blocks when an offer is opened for editing", () => {
    const offer = mapOfferDetail({
      reference: "Loc/1/YL/AA",
      lines: [],
      deliveryBatches: [],
      deliveryMode: "Text",
      deliveryText: "Ready stock.",
      deliveryPlace: "Badr City",
      paymentTermsText: "On receipt.",
    })

    const draft = offerToDraft(offer)

    expect(draft.deliveryMode).toBe("text")
    expect(draft.deliveryText).toBe("Ready stock.")
    expect(draft.deliveryPlace).toBe("Badr City")
    expect(draft.paymentTermsText).toBe("On receipt.")
  })
})
