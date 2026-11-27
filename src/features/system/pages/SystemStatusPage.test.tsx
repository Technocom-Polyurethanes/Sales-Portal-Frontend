// @vitest-environment jsdom
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import "@/mock"
import App from "../../../app/App"
import { clearCache } from "../../../lib/cache/queryCache"
import { db } from "../../../mock/db"

import { systemApi } from "../api"

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true

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

const pause = (ms: number) =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms))
  })

describe("System status screen", () => {
  let container: HTMLDivElement
  let root: Root

  const waitFor = async (text: string) => {
    for (let tries = 0; tries < 40; tries += 1) {
      if (container.textContent?.includes(text)) return
      await pause(100)
    }
  }

  beforeEach(async () => {
    clearCache()
    vi.restoreAllMocks()
    db.session.userId = "acct-admin"
    localStorage.setItem("technocom.session", "active")
    localStorage.setItem("sales_portal_jwt", "test-token")
    window.history.pushState({}, "", "/system-status")
    container = document.createElement("div")
    document.body.appendChild(container)
    root = createRoot(container)
  })

  const render = () => act(async () => root.render(<App />))

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    localStorage.clear()
    window.history.pushState({}, "", "/")
  })

  it("shows the admin a localized status snapshot", async () => {
    await render()
    await waitFor("System status")
    await waitFor("Healthy")

    expect(container.textContent).toContain("Up")
    expect(container.textContent).toContain("Connected")
    expect(container.textContent).toContain("Production")

    const headerFor = (title: string) =>
      Array.from(container.querySelectorAll("section")).find(
        (card) => card.querySelector("h2")?.textContent === title,
      )?.querySelector("header")?.textContent

    expect(headerFor("Overall status")).toContain("Healthy")
    expect(headerFor("Database")).toContain("Up")
  })

  it("keeps the cards on screen when refreshing", async () => {
    await render()
    await waitFor("Healthy")

    const refresh = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Refresh",
    )

    await act(async () => refresh?.click())

    expect(container.querySelector(".animate-pulse")).toBeNull()
    expect(container.textContent).toContain("Healthy")
  })

  it("shows a retryable error when the status call fails", async () => {
    vi.spyOn(systemApi, "status").mockRejectedValue(new Error("Status unavailable"))
    await render()
    await waitFor("Status unavailable")

    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      "Retry",
    )
  })
})
