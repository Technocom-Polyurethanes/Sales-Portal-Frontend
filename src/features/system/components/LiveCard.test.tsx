// @vitest-environment jsdom
import { act } from "react"
import { createRoot } from "react-dom/client"
import { beforeEach, describe, expect, it } from "vitest"

import { ToastProvider } from "../../../components/ui/ToastProvider"
import { I18nProvider } from "../../../i18n/I18nProvider"
import type { SystemLiveStatus } from "../types"

import LiveCard from "./LiveCard"
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

const base: SystemLiveStatus = {
  state: "connected",
  disabled: false,
  pollingFallback: false,
  changes: "connected",
  notifications: "connected",
}

function render(live: SystemLiveStatus) {
  const container = document.createElement("div")
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => {
    root.render(
      <I18nProvider>
        <ToastProvider>
          <LiveCard
            live={live}
            now={Date.parse("2026-11-28T10:00:10.000Z")}
            locale="en-US"
          />
        </ToastProvider>
      </I18nProvider>,
    )
  })
  return { container, root }
}

function badge(container: HTMLElement, label: string) {
  return Array.from(container.querySelectorAll("span")).find(
    (element) =>
      element.textContent === label &&
      element.className.includes("rounded-full"),
  )
}

describe("live updates card", () => {
  beforeEach(() => localStorage.clear())

  it("marks an inactive fallback as neutral and an active fallback amber", () => {
    const inactive = render(base)
    expect(badge(inactive.container, "Not needed")?.className).toContain(
      "text-success",
    )
    expect(badge(inactive.container, "Not needed")?.className).not.toContain(
      "text-warning",
    )
    act(() => inactive.root.unmount())
    inactive.container.remove()

    const active = render({ ...base, pollingFallback: true })
    expect(badge(active.container, "Active")?.className).toContain(
      "text-warning",
    )
    act(() => active.root.unmount())
    active.container.remove()
  })

  it("omits optional details and the error copy button when absent", () => {
    const { container, root } = render({
      ...base,
      lastError: null,
      reconnectCount: undefined,
    })
    expect(container.textContent).toContain("0 since start")
    expect(container.querySelector('[aria-label*="Last error"]')).toBeNull()
    act(() => root.unmount())
    container.remove()
  })

  it("offers a copy button only when a last error exists", () => {
    const { container, root } = render({
      ...base,
      lastError: "SSE stream closed",
    })
    expect(container.querySelector('[aria-label*="Last error"]')).not.toBeNull()
    act(() => root.unmount())
    container.remove()
  })
})
