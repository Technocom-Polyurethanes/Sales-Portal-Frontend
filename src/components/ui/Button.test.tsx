// @vitest-environment jsdom
import { act } from "react"
import { createRoot } from "react-dom/client"
import { afterEach, describe, expect, it } from "vitest"

import Button from "./Button"

describe("Button", () => {
  let container: HTMLDivElement

  afterEach(() => {
    container?.remove()
  })

  it("shows a spinner and blocks repeat clicks while loading", () => {
    container = document.createElement("div")
    document.body.appendChild(container)
    const root = createRoot(container)

    act(() => root.render(<Button loading>Save</Button>))

    const button = container.querySelector("button") as HTMLButtonElement
    expect(button.disabled).toBe(true)
    expect(button.getAttribute("aria-busy")).toBe("true")
    expect(button.querySelector('[aria-hidden="true"]')).not.toBeNull()
    expect(button.textContent).toBe("Save")
  })
})
