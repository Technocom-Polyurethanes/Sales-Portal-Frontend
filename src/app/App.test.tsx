// @vitest-environment jsdom
import { act } from "react"
import { createRoot } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import "@/mock"
import App from "./App"

const settle = async (ms = 400) => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms))
  })
}

describe("application shell", () => {
  let container: HTMLDivElement

  beforeEach(() => {
    localStorage.setItem("technocom.session", "active")
    localStorage.setItem("sales_portal_jwt", "test-token")
    container = document.createElement("div")
    document.body.appendChild(container)
  })

  afterEach(() => {
    container.remove()
    localStorage.clear()
  })

  it("renders the workspace with the offers list", async () => {
    const root = createRoot(container)
    await act(async () => {
      root.render(<App />)
    })
    await settle()

    const text = container.textContent ?? ""
    expect(text).toContain("TECHNOCOM")
    expect(text.toLowerCase()).toContain("good")
    expect(text).toContain("Recent offers")
    expect(text).toContain("3089/OCT./YL/AA")
  })

  it("renders the sign in screen when the session is missing", async () => {
    localStorage.removeItem("technocom.session")
    localStorage.removeItem("sales_portal_jwt")
    const root = createRoot(container)
    await act(async () => {
      root.render(<App />)
    })
    await settle(100)

    const text = container.textContent ?? ""
    expect(text).toContain("Welcome back")
    expect(text).toContain("Log in")
  })
})
