// @vitest-environment jsdom
import { act } from "react"
import { createRoot } from "react-dom/client"
import { afterEach, describe, expect, it, vi } from "vitest"

import { I18nProvider } from "../../i18n/I18nProvider"
import Dialog from "./Dialog"

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement | null = null
afterEach(() => {
  container?.remove()
  document.body.innerHTML = ""
  container = null
  vi.useRealTimers()
})

describe("Dialog animations", () => {
  it("animates out before unmounting", async () => {
    vi.useFakeTimers()
    container = document.createElement("div")
    document.body.append(container)
    const root = createRoot(container)
    const render = (open: boolean) =>
      act(() => {
        root.render(
          <I18nProvider>
            <Dialog open={open} title="Title" onClose={vi.fn()}>
              Body
            </Dialog>
          </I18nProvider>,
        )
      })

    render(true)
    expect(container.querySelector('[role="dialog"]')?.className).toContain(
      "animate-panel-in",
    )

    render(false)
    expect(container.querySelector('[role="dialog"]')?.className).toContain(
      "animate-panel-out",
    )

    await act(async () => {
      vi.advanceTimersByTime(200)
    })
    expect(container.querySelector('[role="dialog"]')).toBeNull()
    root.unmount()
  })
})
