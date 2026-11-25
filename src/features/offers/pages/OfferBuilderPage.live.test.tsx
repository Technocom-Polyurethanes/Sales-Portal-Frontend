// @vitest-environment jsdom
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import "@/mock"
import App from "../../../app/App"
import { clearCache } from "../../../lib/cache/queryCache"
import { live } from "../../../lib/live"
import type { LiveTopic } from "../../../lib/live/topics"
import { db } from "../../../mock/db"

if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}
if (!("ResizeObserver" in globalThis)) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const pause = (ms: number) =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms))
  })

function setValue(element: HTMLInputElement, value: string) {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(element, value)
  element.dispatchEvent(new Event("input", { bubbles: true }))
}

describe("offer builder with live updates", () => {
  let container: HTMLDivElement
  let root: Root | undefined
  let subscriptions: Array<{ topics: readonly LiveTopic[]; listener: (t: LiveTopic[]) => void }>

  beforeEach(() => {
    clearCache()
    subscriptions = []
    vi.spyOn(live, "subscribe").mockImplementation((topics, listener) => {
      const entry = { topics, listener }
      subscriptions.push(entry)
      return () => {
        subscriptions = subscriptions.filter((item) => item !== entry)
      }
    })
    localStorage.setItem("technocom.session", "active")
    localStorage.setItem("sales_portal_jwt", "test-token")
    container = document.createElement("div")
    document.body.appendChild(container)
  })

  afterEach(async () => {
    await act(async () => root?.unmount())
    container.remove()
    localStorage.clear()
    window.history.pushState({}, "", "/")
    vi.restoreAllMocks()
  })

  it("keeps what was typed when the catalog is refreshed in the background", async () => {
    db.session.userId = "acct-admin"
    window.history.pushState({}, "", "/offers/new")
    root = createRoot(container)
    await act(async () => root!.render(<App />))
    for (let tries = 0; tries < 40; tries += 1) {
      await pause(100)
      if (!container.querySelector('[aria-busy="true"]') && container.querySelector("#offer-attention")) break
    }

    const attention = () => container.querySelector<HTMLInputElement>("#offer-attention")!
    const sequence = () => container.querySelector<HTMLInputElement>("#offer-sequence")?.value
    await act(async () => setValue(attention(), "Eng. Mona Typed"))
    const sequenceBefore = sequence()

    // The builder follows customers, materials, catalog and banks, but not offers: a new offer
    // elsewhere would change the sequence number of the one being written.
    const builder = subscriptions.find((item) => item.topics.includes("materials"))
    expect(builder).toBeTruthy()
    expect(builder!.topics).not.toContain("offers")

    await act(async () => builder!.listener(["customers"]))
    await pause(300)

    expect(attention().value).toBe("Eng. Mona Typed")
    expect(sequence()).toBe(sequenceBefore)
  })
})
