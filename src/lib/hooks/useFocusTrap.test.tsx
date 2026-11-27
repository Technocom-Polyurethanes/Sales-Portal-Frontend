// @vitest-environment jsdom
import { act, useRef } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { useFocusTrap } from "./useFocusTrap"

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true

function Fixture({ open }: { open: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useFocusTrap(open, ref)
  return (
    <div>
      <button id="trigger">Trigger</button>
      <div ref={ref} tabIndex={-1}>
        <button id="first">First</button>
        <button id="last">Last</button>
      </div>
    </div>
  )
}

describe("useFocusTrap", () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    container = document.createElement("div")
    document.body.append(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  const render = (open: boolean) =>
    act(() => root.render(<Fixture open={open} />))

  const pressTab = (shiftKey = false) =>
    act(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Tab", shiftKey, bubbles: true }),
      )
    })

  it("cycles Tab and restores focus to the trigger", () => {
    const trigger = document.createElement("button")
    document.body.append(trigger)
    trigger.focus()

    render(true)
    expect(document.activeElement?.id).toBe("first")

    document.querySelector<HTMLButtonElement>("#last")!.focus()
    pressTab()
    expect(document.activeElement?.id).toBe("first")

    pressTab(true)
    expect(document.activeElement?.id).toBe("last")

    render(false)
    expect(document.activeElement).toBe(trigger)
    trigger.remove()
  })
})
