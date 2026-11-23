// @vitest-environment jsdom
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import "@/mock"
import App from "../../../app/App"
import { clearCache } from "../../../lib/cache/queryCache"
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
  globalThis.ResizeObserver = (class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver)
}

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const pause = (ms: number) =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms))
  })

function setValue(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto =
    element instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype
  Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(element, value)
  element.dispatchEvent(new Event("input", { bubbles: true }))
}

const STORAGE_PREFIX = "technocom.offerBuilder."
const savedKeys = () =>
  Object.keys(localStorage).filter((key) => key.startsWith(STORAGE_PREFIX))

describe("offer builder survives a page refresh", () => {
  let container: HTMLDivElement
  let root: Root | undefined

  /** Loads the app from scratch, the way a browser refresh does. */
  const load = async (path: string) => {
    clearCache()
    db.session.userId = "acct-admin"
    window.history.pushState({}, "", path)
    root = createRoot(container)
    await act(async () => {
      root!.render(<App />)
    })
    await pause(200)
    for (let tries = 0; tries < 40; tries += 1) {
      if (!container.querySelector('[aria-busy="true"]')) break
      await pause(100)
    }
    await pause(100)
  }
  const refresh = async () => {
    const path = window.location.pathname + window.location.search
    await act(async () => root?.unmount())
    await load(path)
  }

  const button = (label: string) =>
    Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find(
      (item) => item.textContent?.trim() === label,
    )
  const attention = () => container.querySelector<HTMLInputElement>("#offer-attention")!
  const notice = () => container.querySelector('[role="status"]')

  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {})
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

  it("brings back what was typed and says so", async () => {
    await load("/offers/new")
    expect(notice()).toBeNull()

    await act(async () => setValue(attention(), "Nader William"))
    await refresh()

    expect(attention().value).toBe("Nader William")
    expect(notice()?.textContent).toContain("Unsaved offer restored")
  })

  it("keeps nothing for a builder that was opened and left untouched", async () => {
    await load("/offers/new")
    await pause(600)
    expect(savedKeys()).toEqual([])

    await refresh()

    expect(notice()).toBeNull()
    expect(savedKeys()).toEqual([])
  })

  it("starts over only after a second confirming click", async () => {
    await load("/offers/new")
    await act(async () => setValue(attention(), "Typed by mistake"))
    await refresh()

    await act(async () => button("Start over")!.click())
    // The first click only asks; nothing is thrown away yet.
    expect(attention().value).toBe("Typed by mistake")
    expect(savedKeys().length).toBe(1)

    await act(async () => button("Discard and start over")!.click())
    await pause(600)

    expect(attention().value).not.toBe("Typed by mistake")
    expect(notice()).toBeNull()
    expect(savedKeys()).toEqual([])

    await refresh()
    expect(notice()).toBeNull()
  })

  it("hides the notice and keeps the form when asked to keep editing", async () => {
    await load("/offers/new")
    await act(async () => setValue(attention(), "Keep me"))
    await refresh()

    await act(async () => button("Keep editing")!.click())

    expect(notice()).toBeNull()
    expect(attention().value).toBe("Keep me")
    expect(savedKeys().length).toBe(1)
  })

  it("keeps a revision separate from a new offer", async () => {
    const offer = db.offers[0]
    await load("/offers/new")
    await act(async () => setValue(attention(), "New offer text"))
    await act(async () => root?.unmount())

    await load(`/offers/new?from=${offer.id}`)

    // The revision has its own slot, so the new offer's copy is not offered here.
    expect(notice()).toBeNull()
    expect(attention().value).not.toBe("New offer text")
    expect(savedKeys().length).toBe(1)
  })

  it("removes the copy once the offer is saved as a draft", async () => {
    const offer = db.offers[0]
    const before = db.offers.length
    await load(`/offers/new?from=${offer.id}`)
    await act(async () => setValue(attention(), "Edited before saving"))
    await act(async () => root?.unmount())
    await load(`/offers/new?from=${offer.id}`)
    expect(notice()?.textContent).toContain("Unsaved offer restored")
    expect(savedKeys().length).toBe(1)

    // The mock API refuses a reference that already exists, while the real API numbers a
    // revision itself. Give the source another reference for the duration of the save.
    const originalReference = offer.reference
    offer.reference = "Loc/99999/YL/ZZ"
    try {
      await act(async () => button("Save as draft")!.click())
      await pause(600)
    } finally {
      offer.reference = originalReference
    }

    expect(db.offers.length).toBe(before + 1)
    expect(window.location.pathname).toMatch(/^\/offers\/.+/)
    expect(savedKeys()).toEqual([])
  })
})
