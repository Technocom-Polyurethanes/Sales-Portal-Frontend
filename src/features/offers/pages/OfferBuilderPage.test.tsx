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

const instalment40En =
  "40% of the total offer value as a down payment with the purchase order, and the remaining 60% by a cheque issued to Technocom, due 30 days after receipt."
const instalment40Ar =
  "40% من إجمالي قيمة العرض دفعة مقدمة مع أمر التوريد و60% المتبقية بموجب شيك صادر لشركة تيكنوكوم ويستحق الاستلام بعد 30 يوم"

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
  const paymentTermsText = () =>
    container.querySelector<HTMLTextAreaElement>("#offer-payment-terms-text")!
  const languageButton = (label: string) =>
    Array.from(
      container.querySelectorAll<HTMLButtonElement>(
        '[role="group"][aria-label="PDF language:"] button',
      ),
    ).find((item) => item.textContent === label)
  const selectTerm = async (labelPrefix: string) => {
    const select = container.querySelector<HTMLSelectElement>("#offer-term")!
    const option = Array.from(select.options).find((item) =>
      item.text.startsWith(labelPrefix),
    )!
    await act(async () => {
      select.value = option.value
      select.dispatchEvent(new Event("change", { bubbles: true }))
    })
  }
  const switchDocumentLanguage = async (label: string) => {
    await act(async () => languageButton(label)?.click())
    await pause(50)
  }

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
    expect(paymentTermsText().value).toBe("Due in 45 days")
    expect(db.paymentTerms.some((term) => term.label === "Net 45 custom")).toBe(true)
    expect(errors).toEqual([])
  })

  it("fills the payment conditions from an instalment term", async () => {
    await open("/offers/new")

    await selectTerm("40%")

    expect(paymentTermsText().value).toBe(instalment40En)
    expect(errors).toEqual([])
  })

  it("translates unedited payment conditions when the document language changes", async () => {
    await open("/offers/new")
    await selectTerm("40%")

    expect(paymentTermsText().value).toBe(instalment40En)

    await switchDocumentLanguage("العربية")

    expect(paymentTermsText().value).toBe(instalment40Ar)
    expect(errors).toEqual([])
  })

  it("keeps custom payment conditions when the language or term changes", async () => {
    await open("/offers/new")
    await selectTerm("40%")

    const custom = "Custom split payment for this offer"
    await act(async () => setValue(paymentTermsText(), custom))

    await switchDocumentLanguage("العربية")
    expect(paymentTermsText().value).toBe(custom)

    await selectTerm("Bank transfer")
    expect(paymentTermsText().value).toBe(custom)

    await switchDocumentLanguage("English")
    expect(paymentTermsText().value).toBe(custom)
    expect(errors).toEqual([])
  })

  it("clears an unedited default when selecting a term with no conditions", async () => {
    await open("/offers/new")
    await selectTerm("40%")

    expect(paymentTermsText().value).toBe(instalment40En)

    await selectTerm("Bank transfer")

    expect(paymentTermsText().value).toBe("")
    expect(errors).toEqual([])
  })

  it("keeps stored payment conditions when opening a new version", async () => {
    const offer = db.offers[0]
    const saved = "Stored custom conditions\nSecond line"
    offer.paymentTermsText = saved

    await open(`/offers/new?from=${offer.id}`)

    expect(paymentTermsText().value).toBe(saved)
    expect(errors).toEqual([])
  })
})
