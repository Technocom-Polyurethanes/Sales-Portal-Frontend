// @vitest-environment jsdom
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import "@/mock"
import App from "../../../app/App"
import { clearCache } from "../../../lib/cache/queryCache"
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

const instalment40En =
  "40% of the total offer value as a down payment with the purchase order, and the remaining 60% by a cheque issued to Technocom, due 30 days after receipt."
const instalment40Ar =
  "40% من إجمالي قيمة العرض دفعة مقدمة مع أمر التوريد و60% المتبقية بموجب شيك صادر لشركة تيكنوكوم ويستحق الاستلام بعد 30 يوم"

// The printed Arabic document writes its numbers in Arabic-Indic digits.
const instalment40ArPrinted =
  "٤٠٪ من إجمالي قيمة العرض دفعة مقدمة مع أمر التوريد و٦٠٪ المتبقية بموجب شيك صادر لشركة تيكنوكوم ويستحق الاستلام بعد ٣٠ يوم"

describe("offer view document language", () => {
  let container: HTMLDivElement
  let root: Root | undefined
  let errors: unknown[][]

  const open = async (offerId: string) => {
    db.session.userId = "acct-admin"
    window.history.pushState({}, "", `/offers/${offerId}`)
    root = createRoot(container)
    await act(async () => {
      root!.render(<App />)
    })
    // The mock API answers after a short delay: wait until nothing is loading any more.
    await pause(150)
    for (let tries = 0; tries < 40; tries += 1) {
      if (!container.querySelector('[aria-busy="true"]')) break
      await pause(100)
    }
    await pause(50)
  }

  const documentLanguage = () =>
    container.querySelector("article.offer-document")?.getAttribute("lang")

  const languageButton = (label: string) =>
    Array.from(
      container.querySelectorAll<HTMLButtonElement>(
        '[role="group"][aria-label="PDF language:"] button',
      ),
    ).find((button) => button.textContent === label)

  const previewConditions = () =>
    container.querySelector(".doc-payment-terms p:not(.doc-payment-terms__term)")
      ?.textContent ?? ""

  const summaryConditions = () => {
    const heading = Array.from(container.querySelectorAll("h3")).find(
      (item) =>
        item.textContent === "Payment conditions" &&
        !item.closest(".doc-payment-terms"),
    )
    return heading?.parentElement?.querySelector("p")?.textContent ?? ""
  }

  const summaryValue = (label: string) => {
    const term = Array.from(container.querySelectorAll("dt")).find(
      (item) => item.textContent === label,
    )
    return term?.nextElementSibling?.textContent ?? ""
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

  it("opens in the language the offer was saved in", async () => {
    const offer = db.offers[0]
    offer.documentLanguage = "ar"

    await open(offer.id)

    expect(documentLanguage()).toBe("ar")
    expect(languageButton("العربية")?.getAttribute("aria-pressed")).toBe("true")
  })

  it("switches the document language without changing the saved offer", async () => {
    const offer = db.offers[0]
    offer.documentLanguage = "ar"

    await open(offer.id)
    await act(async () => {
      languageButton("English")?.click()
    })
    await pause(50)

    expect(documentLanguage()).toBe("en")
    expect(languageButton("English")?.getAttribute("aria-pressed")).toBe("true")
    expect(offer.documentLanguage).toBe("ar")
    expect(errors).toEqual([])
  })

  it("shows the offer expiry in the summary when the payment term is due on issue", async () => {
    const offer = db.offers[0]
    offer.paymentTermId = "bank-transfer-purchase-order"
    offer.dueDate = offer.issueDate
    offer.validityDays = 7

    await open(offer.id)

    expect(summaryValue("Issue date")).toBe("21/10/2026")
    expect(summaryValue("Due date")).toBe("28/10/2026")
    expect(errors).toEqual([])
  })

  it("shows unedited payment conditions in the displayed language", async () => {
    const offer = db.offers[0]
    offer.paymentTermId = "instalment-40-60"
    offer.documentLanguage = "en"
    offer.paymentTermsText = instalment40En

    await open(offer.id)

    expect(previewConditions()).toBe(instalment40En)
    expect(summaryConditions()).toBe(instalment40En)

    await act(async () => {
      languageButton("العربية")?.click()
    })
    await pause(50)

    expect(documentLanguage()).toBe("ar")
    expect(previewConditions()).toBe(instalment40ArPrinted)
    expect(summaryConditions()).toBe(instalment40Ar)
    expect(offer.paymentTermsText).toBe(instalment40En)
    expect(offer.documentLanguage).toBe("en")
    expect(errors).toEqual([])
  })

  it("shows the automatic amount in words in the summary and follows the document language", async () => {
    const offer = db.offers[0]
    offer.documentLanguage = "en"

    await open(offer.id)

    expect(container.textContent).toContain("Amount in Words")
    expect(container.textContent).toMatch(/Egyptian Pounds Only/)

    await act(async () => {
      languageButton("العربية")?.click()
    })
    await pause(50)

    expect(container.textContent).toContain("فقط")
    expect(container.textContent).toMatch(/جنيه/)
    expect(errors).toEqual([])
  })

  it("hides the automatic amount in words when the total is zero", async () => {
    const offer = db.offers[0]
    if (offer.totals) offer.totals.total = 0
    ;(offer as any).total = 0

    await open(offer.id)

    expect(container.textContent).not.toContain("Amount in Words")
    expect(container.textContent).not.toContain("المبلغ بالحروف")
  })

  it("keeps edited payment conditions as they are", async () => {
    const offer = db.offers[0]
    const custom = "Custom split payment\nSecond line"
    offer.paymentTermId = "instalment-40-60"
    offer.documentLanguage = "en"
    offer.paymentTermsText = custom

    await open(offer.id)
    await act(async () => {
      languageButton("العربية")?.click()
    })
    await pause(50)

    expect(previewConditions()).toBe(custom)
    expect(summaryConditions()).toBe(custom)
    expect(offer.paymentTermsText).toBe(custom)
    expect(errors).toEqual([])
  })

  it("names and titles every offer action", async () => {
    const offer = db.offers[0]
    await open(offer.id)

    const reference = container.querySelector("h1 bdi")
    expect(reference?.textContent).toBe(offer.reference)
    expect(reference?.getAttribute("dir")).toBe("ltr")
    expect(reference?.classList.contains("tabular-nums")).toBe(true)

    const client = Array.from(container.querySelectorAll('[dir="auto"]')).find(
      (item) => item.textContent === offer.customerName,
    )
    expect(client).toBeTruthy()

    const action = (label: string, title: string) => {
      const button = Array.from(container.querySelectorAll("button")).find(
        (item) => item.textContent?.trim() === label,
      )
      expect(button?.getAttribute("aria-label")).toBe(title)
      expect(button?.getAttribute("title")).toBe(title)
      expect(button?.classList.contains("min-h-[44px]")).toBe(true)
      expect(button?.classList.contains("md:w-auto")).toBe(true)
    }

    action("Print", "Print this offer")
    action("Edit", "Edit this offer as a new version")
    action("Delete", "Delete this offer permanently")
    action("Change status", "Change status for this offer")
    expect(errors).toEqual([])
  })
})
