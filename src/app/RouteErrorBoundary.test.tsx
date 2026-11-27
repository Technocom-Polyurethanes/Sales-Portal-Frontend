// @vitest-environment jsdom
import { act } from "react"
import { createRoot } from "react-dom/client"
import { afterEach, describe, expect, it, vi } from "vitest"

import RouteErrorBoundary from "./RouteErrorBoundary"

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement | null = null
afterEach(() => {
  container?.remove()
  container = null
  vi.restoreAllMocks()
})

function Broken(): never {
  throw new Error("chunk failed")
}

describe("RouteErrorBoundary", () => {
  it("shows a retry message instead of blanking the app", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {})
    container = document.createElement("div")
    document.body.append(container)
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <RouteErrorBoundary message="Could not load this page." retryLabel="Retry">
          <Broken />
        </RouteErrorBoundary>,
      )
    })

    expect(container.textContent).toContain("Could not load this page.")
    expect(container.querySelector("button")?.textContent).toBe("Retry")
    expect(error).toHaveBeenCalled()
    root.unmount()
  })
})
