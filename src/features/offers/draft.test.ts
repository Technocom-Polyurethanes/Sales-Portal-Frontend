import { describe, expect, it } from "vitest"

import { createEmptyDraft, draftId, draftToPayload } from "./draft"

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
