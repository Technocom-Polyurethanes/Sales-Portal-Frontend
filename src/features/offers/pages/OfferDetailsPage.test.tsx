// @vitest-environment jsdom
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

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

const pause = (ms: number) =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms))
  })

describe("offer view document language", () => {
  let container: HTMLDivElement
  let root: Root | undefined

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

  beforeEach(() => {
    clearCache()
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
  })
})
