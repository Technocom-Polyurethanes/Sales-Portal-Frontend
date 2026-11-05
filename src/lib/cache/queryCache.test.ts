import { afterEach, describe, expect, it, vi } from "vitest"

import { cached, clearCache, invalidate, peek } from "./queryCache"

afterEach(() => {
  clearCache()
  vi.useRealTimers()
})

describe("queryCache", () => {
  it("loads once and serves the cached value afterwards", async () => {
    const load = vi.fn().mockResolvedValue(["a"])

    expect(await cached("k", ["customers"], load)).toEqual(["a"])
    expect(await cached("k", ["customers"], load)).toEqual(["a"])
    expect(load).toHaveBeenCalledTimes(1)
    expect(peek("k")).toEqual(["a"])
  })

  it("shares one request between concurrent callers", async () => {
    let resolve!: (value: number) => void
    const load = vi.fn(() => new Promise<number>((r) => (resolve = r)))

    const first = cached("k", ["materials"], load)
    const second = cached("k", ["materials"], load)
    resolve(7)

    expect(await Promise.all([first, second])).toEqual([7, 7])
    expect(load).toHaveBeenCalledTimes(1)
  })

  it("drops only the entries that carry the invalidated tag", async () => {
    await cached("customers:list", ["customers"], async () => 1)
    await cached("materials:list", ["materials"], async () => 2)

    invalidate("customers")

    expect(peek("customers:list")).toBeUndefined()
    expect(peek("materials:list")).toBe(2)
  })

  it("does not keep a response that was in flight when its tag was invalidated", async () => {
    let resolve!: (value: string) => void
    const stale = cached("k", ["customers"], () => new Promise<string>((r) => (resolve = r)))

    invalidate("customers")
    resolve("before the write")

    expect(await stale).toBe("before the write")
    expect(peek("k")).toBeUndefined()

    const fresh = await cached("k", ["customers"], async () => "after the write")
    expect(fresh).toBe("after the write")
  })

  it("does not cache failures", async () => {
    const load = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce("ok")

    await expect(cached("k", ["catalog"], load)).rejects.toThrow("offline")
    expect(await cached("k", ["catalog"], load)).toBe("ok")
    expect(load).toHaveBeenCalledTimes(2)
  })

  it("expires entries after the time to live", async () => {
    vi.useFakeTimers()
    const load = vi.fn().mockResolvedValueOnce("old").mockResolvedValueOnce("new")

    expect(await cached("k", ["catalog"], load, 1000)).toBe("old")
    vi.advanceTimersByTime(1001)

    expect(peek("k")).toBeUndefined()
    expect(await cached("k", ["catalog"], load, 1000)).toBe("new")
  })
})
