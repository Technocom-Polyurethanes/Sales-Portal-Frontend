// @vitest-environment jsdom
import { act } from "react"
import { createRoot } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import "@/mock"
import { accountApi } from "../features/account/api"
import { offersApi } from "../features/offers/api"
import { clearCache } from "../lib/cache/queryCache"
import App from "./App"

// Sileo reads the system theme; jsdom has no matchMedia.
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

function typeInto(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!
  setter.call(input, value)
  input.dispatchEvent(new Event("input", { bubbles: true }))
}

const settle = async (ms = 1000) => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms))
  })
}

async function waitForText(container: HTMLElement, text: string) {
  for (let tries = 0; tries < 50; tries += 1) {
    if ((container.textContent ?? "").includes(text)) return
    await settle(100)
  }
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
    await waitForText(container, "Loc/3089-2026/YL/AA")

    const text = container.textContent ?? ""
    expect(text).toContain("TECHNOCOM")
    expect(text.toLowerCase()).toContain("good")
    expect(text).toContain("Recent documents")
    expect(text).toContain("Loc/3089-2026/YL/AA")
  })

  it("collapses the desktop sidebar and remembers the choice", async () => {
    localStorage.setItem("sales_portal_sidebar_collapsed", "true")
    const root = createRoot(container)
    await act(async () => {
      root.render(<App />)
    })
    await settle()

    const shell = container.querySelector(".app-shell") as HTMLElement
    expect(shell.className).toContain("lg:ms-18")

    const expand = container.querySelector(
      '[aria-label="Expand sidebar"]',
    ) as HTMLButtonElement
    expect(expand).toBeTruthy()

    await act(async () => {
      expand.click()
    })
    expect(shell.className).toContain("lg:ms-60")
    expect(localStorage.getItem("sales_portal_sidebar_collapsed")).toBe("false")

    await act(async () => {
      root.unmount()
    })
  })

  it("shows six recent offers, newest first", async () => {
    clearCache()
    const items = Array.from({ length: 7 }, (_, index) => ({
      id: `offer-${index}`,
      reference: `REF-${index}`,
      serialNumber: 3089 - index,
      version: 1,
      customerId: "cust-1",
      customerName: "Customer",
      customerNameAr: null,
      issueDate: "2026-10-21",
      dueDate: "2026-10-28",
      currency: "EGP",
      status: "draft" as const,
      total: 1000,
      createdByName: "User",
      createdAt: `2026-10-2${index}T09:30:00Z`,
      updatedAt: `2026-10-2${index}T09:30:00Z`,
      lastModifiedByName: "User",
      lastModifiedAt: `2026-10-2${index}T09:30:00Z`,
    }))
    const list = vi.spyOn(offersApi, "list").mockResolvedValue({
      items,
      page: 1,
      pageSize: 200,
      totalCount: items.length,
      totalPages: 1,
    })

    const root = createRoot(container)
    await act(async () => {
      root.render(<App />)
    })
    await settle()

    expect(list).toHaveBeenCalledWith(
      expect.objectContaining({
        pageSize: 200,
        latestOnly: true,
        sortBy: "updatedAt",
        sortDir: "desc",
      }),
    )
    const references = Array.from(container.querySelectorAll("li button")).map(
      (button) => button.querySelector('bdi[dir="ltr"]')?.textContent,
    )
    expect(references).toEqual([
      "REF-0",
      "REF-1",
      "REF-2",
      "REF-3",
      "REF-4",
      "REF-5",
    ])
    expect(container.textContent).not.toContain("REF-6")

    await act(async () => {
      root.unmount()
    })
  })

  it("shows the home page instead of 'not found' when a signed in user is on /login", async () => {
    window.history.pushState({}, "", "/login")
    const root = createRoot(container)
    await act(async () => {
      root.render(<App />)
    })
    await settle()

    const text = container.textContent ?? ""
    expect(text).toContain("Recent documents")
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
    expect(text).toContain("Recent documents")
    expect(text.toLowerCase()).not.toContain("not found")
  })

  it("renders the customer, material and bank catalogue pages", async () => {
    const cases = [
      ["/customers", "Duravit Egypt for Sanitary Ware"],
      ["/customers/cust-1", "Duravit Egypt for Sanitary Ware"],
      ["/products", "DALTORIM EG 26200 - D"],
      ["/banks", "QNB"],
    ] as const

    for (const [path, expected] of cases) {
      window.history.pushState({}, "", path)
      clearCache()
      const root = createRoot(container)
      await act(async () => {
        root.render(<App />)
      })
      await settle()
      await waitForText(container, expected)
      expect(container.textContent ?? "").toContain(expected)
      await act(async () => {
        root.unmount()
      })
    }
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
}, 15000)
