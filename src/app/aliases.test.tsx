// @vitest-environment jsdom
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import "@/mock"
import App from "./App"
import { clearCache } from "../lib/cache/queryCache"
import { db } from "../mock/db"
;(globalThis as {
  IS_REACT_ACT_ENVIRONMENT?: boolean
}).IS_REACT_ACT_ENVIRONMENT = true

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

const pause = (ms = 100) =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms))
  })

describe("short page addresses", () => {
  let container: HTMLDivElement
  let root: Root

  const visit = async (address: string, expectRedirect = true) => {
    clearCache()
    const path = address.split("?")[0]
    window.history.pushState({}, "", address)
    root = createRoot(container)
    await act(async () => root.render(<App />))
    for (let tries = 0; tries < 30; tries += 1) {
      if (expectRedirect && window.location.pathname !== path) return
      if (
        !expectRedirect &&
        container.textContent?.includes("don't have access")
      )
        return
      await pause()
    }
  }

  beforeEach(() => {
    db.session.userId = "acct-admin"
    localStorage.setItem("technocom.session", "active")
    localStorage.setItem("sales_portal_jwt", "test-token")
    container = document.createElement("div")
    document.body.appendChild(container)
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    localStorage.clear()
    window.history.pushState({}, "", "/")
  })

  it("redirects /logs to the audit log with its filters", async () => {
    await visit("/logs?outcome=failure&category=auth&preset=today")
    expect(window.location.pathname).toBe("/audit-logs")
    expect(window.location.search).toBe(
      "?outcome=failure&category=auth&preset=today",
    )
  })

  it("redirects /system to system status with its query", async () => {
    await visit("/system?scenario=degraded")
    expect(window.location.pathname).toBe("/system-status")
    expect(window.location.search).toBe("?scenario=degraded")
  })

  it("does not let another role through the short addresses", async () => {
    db.session.userId = "acct-sales"
    await visit("/logs", false)
    expect(container.textContent).toContain("don't have access")
    expect(window.location.pathname).toBe("/logs")
  })
})
