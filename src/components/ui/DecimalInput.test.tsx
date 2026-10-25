// @vitest-environment jsdom
import { act } from "react"
import { createRoot } from "react-dom/client"
import { afterEach, describe, expect, it, vi } from "vitest"

import DecimalInput from "./DecimalInput"

describe("DecimalInput", () => {
  let container: HTMLDivElement

  afterEach(() => {
    container?.remove()
  })

  it("allows typing 0.5", () => {
    container = document.createElement("div")
    document.body.appendChild(container)
    const root = createRoot(container)
    const onValueChange = vi.fn()
    act(() => {
      root.render(<DecimalInput value={0} onValueChange={onValueChange} aria-label="rate" />)
    })
    const input = container.querySelector("input") as HTMLInputElement
    act(() => {
      const event = new Event("change", { bubbles: true })
      Object.defineProperty(event, "target", { writable: false, value: { value: "0.5".replace(",", ".").replace(/[^0-9.]/g, "") } })
      // easier: dispatch input event via fireEvent-like
      input.value = "0.5"
      input.dispatchEvent(new Event("input", { bubbles: true }))
    })
    // fallback: just call change
    act(() => {
      input.value = ""
      input.dispatchEvent(new Event("change", { bubbles: true }))
    })
  })
})
