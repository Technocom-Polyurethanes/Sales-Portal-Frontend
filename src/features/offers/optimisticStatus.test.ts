import { describe, expect, it } from "vitest"

import type { OfferDetailsData } from "./hooks/useOfferDetails"
import { withOfferStatus } from "./optimisticStatus"

const base = {
  offer: { id: "b", status: "draft" },
  versions: [
    { id: "a", status: "draft" },
    { id: "b", status: "draft" },
  ],
} as unknown as OfferDetailsData

describe("withOfferStatus", () => {
  it("updates the offer and only its own row in the version list", () => {
    const next = withOfferStatus(base, "sent" as never)
    expect(next.offer.status).toBe("sent")
    expect(next.versions.map((v) => v.status)).toEqual(["draft", "sent"])
  })

  it("does not mutate the input", () => {
    withOfferStatus(base, "sent" as never)
    expect(base.offer.status).toBe("draft")
  })
})
