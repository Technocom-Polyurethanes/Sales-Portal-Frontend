// @vitest-environment jsdom
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import "@/mock"
import App from "../../../app/App"
import { clearCache } from "../../../lib/cache/queryCache"
import { formatDateTime } from "../../../lib/formatters/date"
import { db } from "../../../mock/db"

// Sileo reads the system theme; jsdom has no matchMedia.
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

// The scaled document preview and the toasts observe their size; jsdom has no ResizeObserver.
if (!("ResizeObserver" in globalThis)) {
  globalThis.ResizeObserver = (class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver)
}

// React only batches updates inside act() when this flag is set.
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const pause = (ms: number) =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms))
  })

// Midday UTC, so the local day is the same in every time zone the tests may run in.
const firstCreatedAt = "2026-11-17T12:05:00.000Z"
const secondCreatedAt = "2026-11-17T13:23:00.000Z"
const thirdCreatedAt = "2026-11-18T12:21:00.000Z"
const thirdModifiedAt = "2026-11-19T12:45:00.000Z"

describe("offer summary creation date", () => {
  let container: HTMLDivElement
  let root: Root | undefined

  const seedChain = () => {
    const base = structuredClone(db.offers[0])
    const version = (n: number, createdAt: string, parent?: string) => ({
      ...structuredClone(base),
      id: `chain-v${n}`,
      reference: "Loc/900/YL/AA",
      version: n,
      parentOfferId: parent,
      createdAt,
      updatedAt: n === 3 ? thirdModifiedAt : createdAt,
    })
    db.offers.push(
      version(1, firstCreatedAt),
      version(2, secondCreatedAt, "chain-v1"),
      version(3, thirdCreatedAt, "chain-v2"),
    )
  }

  const open = async (offerId: string) => {
    db.session.userId = "acct-admin"
    window.history.pushState({}, "", `/offers/${offerId}`)
    root = createRoot(container)
    await act(async () => {
      root!.render(<App />)
    })
    await pause(150)
    for (let tries = 0; tries < 40; tries += 1) {
      if (!container.querySelector('[aria-busy="true"]')) break
      await pause(100)
    }
    await pause(50)
  }

  const summaryText = () =>
    Array.from(container.querySelectorAll("dl[aria-label]"))
      .map((item) => item.textContent ?? "")
      .join(" ")

  beforeEach(() => {
    clearCache()
    vi.spyOn(console, "error").mockImplementation(() => {})
    localStorage.setItem("technocom.session", "active")
    localStorage.setItem("sales_portal_jwt", "test-token")
    container = document.createElement("div")
    document.body.appendChild(container)
    seedChain()
  })

  afterEach(async () => {
    await act(async () => root?.unmount())
    container.remove()
    localStorage.clear()
    window.history.pushState({}, "", "/")
    vi.restoreAllMocks()
  })

  it("shows the first version's creation date while a later version is open", async () => {
    await open("chain-v3")

    const summary = summaryText()
    expect(summary).toContain(`Created on ${formatDateTime(firstCreatedAt)}`)
    expect(summary).not.toContain(formatDateTime(thirdCreatedAt))
    expect(summary).toContain(`Last modified on ${formatDateTime(thirdModifiedAt)}`)
  })

  it("lists every version with its own creation date", async () => {
    await open("chain-v3")

    // The page renders the version history in more than one layout: compare the distinct rows.
    const rows = [
      ...new Set(
        Array.from(container.querySelectorAll("ol li"))
          .map((item) => item.textContent ?? "")
          .filter((text) => /^v\d/.test(text)),
      ),
    ]
    expect(rows).toHaveLength(3)
    expect(rows[0]).toContain(formatDateTime(thirdCreatedAt))
    expect(rows[1]).toContain(formatDateTime(secondCreatedAt))
    expect(rows[2]).toContain(formatDateTime(firstCreatedAt))
    // The newest version was modified later than it was created.
    expect(rows[0]).toContain(formatDateTime(thirdModifiedAt))
  })
})
