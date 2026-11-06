// @vitest-environment jsdom
import { act } from "react"
import { createRoot } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import "@/mock"
import { accountApi } from "../features/account/api"
import App from "./App"

function typeInto(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!
  setter.call(input, value)
  input.dispatchEvent(new Event("input", { bubbles: true }))
}

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
    window.history.pushState({}, "", "/")
    vi.restoreAllMocks()
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
    expect(text).toContain("Loc/3089/YL/AA")
  })

  it("shows the home page instead of 'not found' when a signed in user is on /login", async () => {
    window.history.pushState({}, "", "/login")
    const root = createRoot(container)
    await act(async () => {
      root.render(<App />)
    })
    await settle()

    const text = container.textContent ?? ""
    expect(text).toContain("Recent offers")
    expect(text).not.toContain("Welcome back")
    expect(window.location.pathname).toBe("/")
  })

  it("lands on the home page after signing in from /login", async () => {
    localStorage.removeItem("technocom.session")
    localStorage.removeItem("sales_portal_jwt")
    window.history.pushState({}, "", "/login")
    vi.spyOn(accountApi, "login").mockResolvedValue({
      token: "test-token",
      user: { id: "1", username: "kero", fullName: "Kero" },
    })

    const root = createRoot(container)
    await act(async () => {
      root.render(<App />)
    })
    await settle(100)
    expect(container.textContent ?? "").toContain("Welcome back")

    await act(async () => {
      typeInto(container.querySelector<HTMLInputElement>("#username")!, "kero")
      typeInto(container.querySelector<HTMLInputElement>("#password")!, "secret")
    })
    await act(async () => {
      container
        .querySelector("form")!
        .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))
    })
    await settle()

    expect(window.location.pathname).toBe("/")
    const text = container.textContent ?? ""
    expect(text).toContain("Recent offers")
    expect(text.toLowerCase()).not.toContain("not found")
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
