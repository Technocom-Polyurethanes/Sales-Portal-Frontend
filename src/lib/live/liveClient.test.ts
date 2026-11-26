// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { createLiveClient, type LiveConnection } from "./liveClient"

const encoder = new TextEncoder()

/** A response body the test writes to by hand. */
function fakeStream() {
  let controller!: ReadableStreamDefaultController<Uint8Array>
  const body = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c
    },
  })
  return {
    body,
    send: (text: string) => controller.enqueue(encoder.encode(text)),
    end: () => controller.close(),
  }
}

const ready = "event: ready\ndata: {}\n\n"
const change = (...topics: string[]) =>
  `event: change\ndata: ${JSON.stringify({ topics })}\n\n`
const notification = {
  id: "11111111-1111-4111-8111-111111111111",
  type: "offer.created",
  actorName: "Youssef Labib",
  entityType: "offer",
  entityId: "22222222-2222-4222-8222-222222222222",
  entityLabel: "Loc/0378-2026/YL/AA",
  meta: {},
  createdAt: "2026-11-26T09:15:00Z",
  readAt: null,
}
const notified = `event: notification\ndata: ${JSON.stringify(notification)}\n\n`

/** Lets promise callbacks (stream reads) run without moving the fake clock. */
const settle = async () => {
  for (let i = 0; i < 10; i += 1) await Promise.resolve()
}

function setup(overrides: Partial<Parameters<typeof createLiveClient>[0]> = {}) {
  const streams: ReturnType<typeof fakeStream>[] = []
  const connect = vi.fn(async (_signal: AbortSignal): Promise<LiveConnection> => {
    const stream = fakeStream()
    streams.push(stream)
    return { status: 200, body: stream.body }
  })
  const invalidateCache = vi.fn()
  const client = createLiveClient({
    connect,
    invalidateCache,
    debounceMs: 100,
    silenceMs: 60_000,
    pollMs: 30_000,
    baseDelayMs: 1_000,
    maxDelayMs: 8_000,
    random: () => 0.5, // jitter factor is exactly 1
    ...overrides,
  })
  return { client, connect, invalidateCache, streams }
}

async function open(setupResult = setup()) {
  setupResult.client.start()
  await settle()
  setupResult.streams[0].send(ready)
  await settle()
  return setupResult
}

function setVisibility(state: "visible" | "hidden") {
  Object.defineProperty(document, "visibilityState", { value: state, configurable: true })
  document.dispatchEvent(new Event("visibilitychange"))
}

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  setVisibility("visible")
  vi.useRealTimers()
})

describe("live client", () => {
  it("goes live on ready without reloading anything the first time", async () => {
    const { client, invalidateCache } = await open()
    const listener = vi.fn()
    client.subscribe(["customers", "offers"], listener)

    expect(client.getStatus()).toBe("live")
    await vi.advanceTimersByTimeAsync(1_000)
    expect(listener).not.toHaveBeenCalled()
    expect(invalidateCache).not.toHaveBeenCalled()
    client.stop()
  })

  it("drops stale cache at once and calls matching listeners after the debounce", async () => {
    const { client, streams, invalidateCache } = await open()
    const listener = vi.fn()
    client.subscribe(["customers"], listener)

    streams[0].send(change("customers"))
    await settle()

    expect(invalidateCache).toHaveBeenCalledWith("customers")
    expect(listener).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(100)
    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith(["customers"])
    client.stop()
  })

  it("merges a burst into a single call", async () => {
    const { client, streams } = await open()
    const listener = vi.fn()
    client.subscribe(["customers", "offers"], listener)

    streams[0].send(change("offers"))
    await settle()
    await vi.advanceTimersByTimeAsync(40)
    streams[0].send(change("customers", "offers"))
    await settle()
    await vi.advanceTimersByTimeAsync(100)

    expect(listener).toHaveBeenCalledTimes(1)
    expect([...listener.mock.calls[0][0]].sort()).toEqual(["customers", "offers"])
    client.stop()
  })

  it("only calls subscribers whose topics changed, and stops after unsubscribe", async () => {
    const { client, streams } = await open()
    const offers = vi.fn()
    const users = vi.fn()
    const unsubscribe = client.subscribe(["offers"], offers)
    client.subscribe(["users"], users)

    streams[0].send(change("offers"))
    await settle()
    await vi.advanceTimersByTimeAsync(100)
    expect(offers).toHaveBeenCalledTimes(1)
    expect(users).not.toHaveBeenCalled()

    unsubscribe()
    streams[0].send(change("offers"))
    await settle()
    await vi.advanceTimersByTimeAsync(100)
    expect(offers).toHaveBeenCalledTimes(1)
    client.stop()
  })

  it("ignores invalid JSON and unknown topics", async () => {
    const { client, streams, invalidateCache } = await open()
    const listener = vi.fn()
    client.subscribe(["offers"], listener)

    streams[0].send("event: change\ndata: not json\n\n")
    streams[0].send('event: change\ndata: {"topics":"offers"}\n\n')
    streams[0].send(change("mystery"))
    await settle()
    await vi.advanceTimersByTimeAsync(200)

    expect(listener).not.toHaveBeenCalled()
    expect(invalidateCache).not.toHaveBeenCalled()
    client.stop()
  })

  it("holds announcements while the tab is hidden and delivers them when shown", async () => {
    const { client, streams } = await open()
    const listener = vi.fn()
    client.subscribe(["offers"], listener)

    setVisibility("hidden")
    streams[0].send(change("offers"))
    await settle()
    await vi.advanceTimersByTimeAsync(500)
    expect(listener).not.toHaveBeenCalled()

    setVisibility("visible")
    expect(listener).toHaveBeenCalledWith(["offers"])
    client.stop()
  })

  it("delivers notifications immediately, even while the tab is hidden", async () => {
    const { client, streams } = await open()
    const listener = vi.fn()
    client.subscribeNotifications(listener)

    setVisibility("hidden")
    streams[0].send(notified)
    await settle()

    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith(notification)
    client.stop()
  })

  it("ignores malformed notifications", async () => {
    const { client, streams } = await open()
    const listener = vi.fn()
    client.subscribeNotifications(listener)

    streams[0].send("event: notification\ndata: not json\n\n")
    streams[0].send('event: notification\ndata: {"id":"x"}\n\n')
    await settle()

    expect(listener).not.toHaveBeenCalled()
    client.stop()
  })

  it("fires ready listeners on the first connect and on every reconnect", async () => {
    const { client, streams } = setup()
    const onReady = vi.fn()
    client.onReady(onReady)

    client.start()
    await settle()
    streams[0].send(ready)
    await settle()
    expect(onReady).toHaveBeenCalledTimes(1)

    streams[0].end()
    await settle()
    await vi.advanceTimersByTimeAsync(1_000)
    streams[1].send(ready)
    await settle()
    expect(onReady).toHaveBeenCalledTimes(2)
    client.stop()
  })

  it("reconnects with backoff and reloads everything once it is back", async () => {
    const { client, connect, streams } = await open()
    const listener = vi.fn()
    client.subscribe(["offers"], listener)

    streams[0].end()
    await settle()
    expect(client.getStatus()).toBe("offline")
    expect(connect).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(999)
    expect(connect).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1)
    expect(connect).toHaveBeenCalledTimes(2)

    streams[1].send(ready)
    await settle()
    await vi.advanceTimersByTimeAsync(100)
    expect(client.getStatus()).toBe("live")
    expect(listener).toHaveBeenCalledTimes(1) // resync after the gap
    client.stop()
  })

  it("backs off further after repeated failures, up to the maximum", async () => {
    const connect = vi.fn(async (): Promise<LiveConnection> => {
      throw new Error("network down")
    })
    const { client } = setup({ connect })
    client.start()
    await settle()
    expect(connect).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(1_000)
    expect(connect).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(2_000)
    expect(connect).toHaveBeenCalledTimes(3)
    await vi.advanceTimersByTimeAsync(4_000)
    expect(connect).toHaveBeenCalledTimes(4)
    await vi.advanceTimersByTimeAsync(8_000)
    expect(connect).toHaveBeenCalledTimes(5)
    await vi.advanceTimersByTimeAsync(8_000) // capped, not 16s
    expect(connect).toHaveBeenCalledTimes(6)
    client.stop()
  })

  it("polls while the stream is down and stops polling once it is back", async () => {
    const connect = vi
      .fn<(signal: AbortSignal) => Promise<LiveConnection>>()
      .mockRejectedValueOnce(new Error("down"))
    const { client, streams } = setup({ connect })
    const listener = vi.fn()
    client.subscribe(["users"], listener)
    client.start()
    await settle()

    await vi.advanceTimersByTimeAsync(30_000 + 100)
    expect(listener).toHaveBeenCalled()
    const callsWhileDown = listener.mock.calls.length

    // The retry (scheduled before the poll) connects.
    const stream = fakeStream()
    streams.push(stream)
    connect.mockResolvedValue({ status: 200, body: stream.body })
    await vi.advanceTimersByTimeAsync(8_000) // the longest the backoff can wait
    expect(connect).toHaveBeenLastCalledWith(expect.any(AbortSignal))
    stream.send(ready)
    await settle()
    await vi.advanceTimersByTimeAsync(100)
    expect(client.getStatus()).toBe("live")
    const afterResync = listener.mock.calls.length

    await vi.advanceTimersByTimeAsync(50_000) // longer than the poll interval, shorter than the silence limit
    expect(listener.mock.calls.length).toBe(afterResync)
    expect(afterResync).toBeGreaterThanOrEqual(callsWhileDown)
    client.stop()
  })

  it("stops for good when the token is refused", async () => {
    const connect = vi.fn(async (): Promise<LiveConnection> => ({ status: 401, body: null }))
    const { client } = setup({ connect })
    client.start()
    await settle()
    await vi.advanceTimersByTimeAsync(60_000)

    expect(connect).toHaveBeenCalledTimes(1)
    expect(client.getStatus()).toBe("idle")
  })

  it("marks the feature unsupported on 404 and does not retry", async () => {
    const connect = vi.fn(async (): Promise<LiveConnection> => ({ status: 404, body: null }))
    const { client } = setup({ connect })
    client.start()
    await settle()
    await vi.advanceTimersByTimeAsync(60_000)

    expect(connect).toHaveBeenCalledTimes(1)
    expect(client.getStatus()).toBe("unsupported")
  })

  it("treats a silent stream as dead and reconnects", async () => {
    const { client, connect } = await open(setup({ silenceMs: 5_000 }))
    await vi.advanceTimersByTimeAsync(5_000)
    await settle()
    expect(client.getStatus()).toBe("offline")

    await vi.advanceTimersByTimeAsync(1_000)
    expect(connect).toHaveBeenCalledTimes(2)
    client.stop()
  })

  it("aborts the connection and stays quiet after stop", async () => {
    const { client, connect, streams } = await open()
    const signal = connect.mock.calls[0][0]
    const listener = vi.fn()
    client.subscribe(["offers"], listener)

    client.stop()
    await settle()
    expect(signal.aborted).toBe(true)
    expect(client.getStatus()).toBe("idle")

    try {
      streams[0].send(change("offers"))
    } catch {
      // the stream may already be cancelled
    }
    await vi.advanceTimersByTimeAsync(60_000)
    expect(listener).not.toHaveBeenCalled()
    expect(connect).toHaveBeenCalledTimes(1)
  })

  it("keeps notifying other subscribers when one listener throws", async () => {
    const { client, streams } = await open()
    const second = vi.fn()
    client.subscribe(["offers"], () => {
      throw new Error("boom")
    })
    client.subscribe(["offers"], second)

    streams[0].send(change("offers"))
    await settle()
    await vi.advanceTimersByTimeAsync(100)
    expect(second).toHaveBeenCalledTimes(1)
    client.stop()
  })
})

