import { describe, expect, it } from "vitest"

import { LIVE_TOPICS, cacheTagsFor, isLiveTopic } from "./topics"

describe("live topics", () => {
  it("recognises only the topics the server announces", () => {
    for (const topic of LIVE_TOPICS) expect(isLiveTopic(topic)).toBe(true)
    expect(isLiveTopic("nope")).toBe(false)
    expect(isLiveTopic(42)).toBe(false)
    expect(isLiveTopic(undefined)).toBe(false)
  })

  it("maps topics to the cached data they make stale, without duplicates", () => {
    expect(cacheTagsFor(["customers"])).toEqual(["customers"])
    expect(cacheTagsFor(["offers"])).toEqual(["customers"])
    expect(cacheTagsFor(["banks", "catalog"]).sort()).toEqual(["banks", "catalog"])
    expect(cacheTagsFor(["customers", "offers"])).toEqual(["customers"])
    expect(cacheTagsFor(["users", "imports"])).toEqual([])
    expect(cacheTagsFor(["audit"])).toEqual([])
  })
})
