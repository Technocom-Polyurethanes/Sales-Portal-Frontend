import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { vi } from "vitest"

import "@/mock"
import App from "../../../app/App"
import { clearCache } from "../../../lib/cache/queryCache"
import { db } from "../../../mock/db"
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

const pause = (ms: number) =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms))
  })

export function isoDay(date: Date) {
  const pad = (part: number) => String(part).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function createAuditHarness() {
  let container: HTMLDivElement | undefined
  let root: Root | undefined

  const query = () => new URLSearchParams(window.location.search)
  const tableText = () => document.querySelector("tbody")?.textContent ?? ""
  const buttons = () => [...document.querySelectorAll("button")]
  const byText = (text: string) => (button: HTMLButtonElement) =>
    button.textContent?.trim().startsWith(text) ?? false

  const findButton = (predicate: (button: HTMLButtonElement) => boolean) => {
    const button = buttons().find(predicate) as HTMLButtonElement | undefined
    if (!button) throw new Error("Button not found")
    return button
  }

  const waitUntil = async (check: () => boolean) => {
    for (let tries = 0; tries < 40; tries += 1) {
      if (check()) return
      await pause(50)
    }
  }

  const reset = () => {
    clearCache()
    db.session.userId = "acct-admin"
    localStorage.setItem("technocom.session", "active")
    localStorage.setItem("sales_portal_jwt", "test-token")
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    })
  }

  const mount = async (path = "/audit-logs", ready = "7 days") => {
    window.history.pushState({}, "", path)
    container = document.createElement("div")
    document.body.appendChild(container)
    root = createRoot(container)
    await act(async () => root!.render(<App />))
    await waitUntil(() => document.body.textContent?.includes(ready) ?? false)
  }

  const dispose = async () => {
    if (root) await act(async () => root!.unmount())
    container?.remove()
    localStorage.clear()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    window.history.pushState({}, "", "/")
    root = undefined
    container = undefined
  }

  const setSelect = (label: string, value: string) => {
    const select = document.querySelector(
      `select[aria-label="${label}"]`,
    ) as HTMLSelectElement
    Object.getOwnPropertyDescriptor(
      HTMLSelectElement.prototype,
      "value",
    )!.set!.call(select, value)
    select.dispatchEvent(new Event("change", { bubbles: true }))
  }

  return {
    query,
    tableText,
    buttons,
    findButton,
    byText,
    waitUntil,
    reset,
    mount,
    dispose,
    setSelect,
    click: (button: HTMLButtonElement) => act(async () => button.click()),
    change: (work: () => void) => act(async () => work()),
  }
}

export type AuditHarness = ReturnType<typeof createAuditHarness>
