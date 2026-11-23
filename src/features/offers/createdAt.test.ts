import { describe, expect, it } from "vitest"

import { offerCreatedAt } from "./createdAt"

const v1 = { version: 1, createdAt: "2026-11-17T09:05:00.000Z" }
const v2 = { version: 2, createdAt: "2026-11-17T10:23:00.000Z" }
const v4 = { version: 4, createdAt: "2026-11-18T15:21:00.000Z" }

describe("offerCreatedAt", () => {
  it("uses the first creation date the API reports for the offer", () => {
    const offer = { createdAt: v4.createdAt, rootCreatedAt: v1.createdAt }

    expect(offerCreatedAt(offer, [v4, v2, v1])).toBe(v1.createdAt)
  })

  it("falls back to v1 of the version history while the API sends no root date", () => {
    const offer = { createdAt: v4.createdAt }

    expect(offerCreatedAt(offer, [v4, v2, v1])).toBe(v1.createdAt)
    expect(offerCreatedAt(offer, [v1, v2, v4])).toBe(v1.createdAt)
  })

  it("falls back to the open version when there is nothing else", () => {
    const offer = { createdAt: v4.createdAt }

    expect(offerCreatedAt(offer, [])).toBe(v4.createdAt)
    expect(offerCreatedAt(offer, undefined)).toBe(v4.createdAt)
  })
})
