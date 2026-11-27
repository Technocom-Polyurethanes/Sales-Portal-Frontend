// @vitest-environment jsdom
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import "@/mock"
import App from "../../../app/App"
import { clearCache } from "../../../lib/cache/queryCache"
import { db } from "../../../mock/db"

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

function setSelect(label: string, value: string) {
  const select = document.querySelector(
    `select[aria-label="${label}"]`,
  ) as HTMLSelectElement
  Object.getOwnPropertyDescriptor(
    HTMLSelectElement.prototype,
    "value",
  )!.set!.call(select, value)
  select.dispatchEvent(new Event("change", { bubbles: true }))
}

describe("Activity log screen", () => {
  let container: HTMLDivElement
  let root: Root

  const waitFor = async (text: string) => {
    for (let tries = 0; tries < 30; tries += 1) {
      if (document.body.textContent?.includes(text)) return
      await pause(100)
    }
  }

  const tableText = () => document.querySelector("tbody")?.textContent ?? ""

  const waitForRows = async () => {
    for (let tries = 0; tries < 30; tries += 1) {
      if (tableText().includes("Changed offer status")) return
      await pause(100)
    }
  }

  beforeEach(async () => {
    clearCache()
    db.session.userId = "acct-admin"
    localStorage.setItem("technocom.session", "active")
    localStorage.setItem("sales_portal_jwt", "test-token")
    window.history.pushState({}, "", "/audit-logs")
    container = document.createElement("div")
    document.body.appendChild(container)
    root = createRoot(container)
    await act(async () => root.render(<App />))
    await waitFor("Activity log")
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    localStorage.clear()
    window.history.pushState({}, "", "/")
  })

  it("lists the newest audit entries with localized action labels", async () => {
    await waitForRows()
    expect(tableText()).toContain("Amgad Anwar")
    expect(tableText()).toContain("Success")
    expect(tableText()).toContain("Sign-in failed")
  })

  it("filters by action", async () => {
    await waitForRows()
    await act(async () => setSelect("Action", "customer.created"))
    await pause(300)

    expect(tableText()).toContain("Created customer")
    expect(tableText()).not.toContain("Changed offer status")
  })
})
