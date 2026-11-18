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

// React only batches updates inside act() when this flag is set.
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const pause = (ms: number) =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms))
  })

function setValue(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(element, value)
  element.dispatchEvent(new Event("input", { bubbles: true }))
}

describe("offer builder", () => {
  let container: HTMLDivElement
  let root: Root | undefined
  let errors: unknown[][]

  const open = async (path: string) => {
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

  const button = (label: string) =>
    Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find(
      (item) => item.textContent?.trim() === label,
    )
  const dialog = () => document.body.querySelector('[role="dialog"]')

  beforeEach(() => {
    clearCache()
    errors = []
    vi.spyOn(console, "error").mockImplementation((...args) => {
      errors.push(args)
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

  it("opens a new version with the price of every line filled in", async () => {
    const offer = db.offers[0]
    await open(`/offers/new?from=${offer.id}`)

    // The price inputs live on the second step, the materials.
    await act(async () => button("Next")?.click())
    await pause(150)

    const rates = Array.from(
      container.querySelectorAll<HTMLInputElement>('input[inputmode="decimal"]'),
    ).map((input) => input.value)
    const expected = offer.lines.map((line) => String(line.ratePerKg))
    for (const rate of expected) {
      expect(rates).toContain(rate)
    }
    expect(container.textContent).not.toContain("null")
    expect(errors).toEqual([])
  })

  it("adds a custom payment term and selects it", async () => {
    await open("/offers/new")

    const addButton = button("Add custom term")
    expect(addButton).toBeTruthy()
    await act(async () => addButton!.click())

    await act(async () => {
      setValue(document.querySelector<HTMLInputElement>("#term-label")!, "Net 45 custom")
      setValue(document.querySelector<HTMLInputElement>("#term-label-ar")!, "صافي ٤٥ يوم")
      setValue(document.querySelector<HTMLInputElement>("#term-days")!, "45")
      setValue(document.querySelector<HTMLTextAreaElement>("#term-conditions")!, "Due in {days} days")
    })
    const save = Array.from(dialog()!.querySelectorAll("button")).find(
      (item) => item.textContent?.trim() === "Save",
    )!
    await act(async () => save.click())
    await pause(300)

    const select = container.querySelector<HTMLSelectElement>("#offer-term")!
    expect(select.options[select.selectedIndex].text).toBe("Net 45 custom")
    expect(container.textContent).toContain("Due in 45 days")
    expect(db.paymentTerms.some((term) => term.label === "Net 45 custom")).toBe(true)
    expect(errors).toEqual([])
  })

  it("shows the conditions of an instalment term", async () => {
    await open("/offers/new")

    const select = container.querySelector<HTMLSelectElement>("#offer-term")!
    const term = Array.from(select.options).find((item) => item.text.startsWith("40%"))!
    await act(async () => {
      select.value = term.value
      select.dispatchEvent(new Event("change", { bubbles: true }))
    })

    expect(container.textContent).toContain("40% of the total offer value")
    expect(container.textContent).toContain("due 30 days after receipt")
    expect(errors).toEqual([])
  })
})
