// @vitest-environment jsdom
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import "@/mock"
import { clearCache } from "../lib/cache/queryCache"
import { db } from "../mock/db"
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

const pause = (ms: number) =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms))
  })

const ADMIN = "acct-admin"
const SALES = "acct-sales"
const ACCOUNTANT = "acct-accountant"

describe("what each role sees", () => {
  let container: HTMLDivElement
  let root: Root | undefined

  const open = async (path: string, userId: string) => {
    db.session.userId = userId
    window.history.pushState({}, "", path)
    root = createRoot(container)
    await act(async () => {
      root!.render(<App />)
    })
    // The mock API answers after a short delay: wait until nothing is loading any more.
    await pause(150)
    for (let tries = 0; tries < 40; tries += 1) {
      if (!container.querySelector('[aria-busy="true"]')) break
      await pause(100)
    }
    await pause(50)
    return container.textContent ?? ""
  }

  const navLinks = () =>
    Array.from(container.querySelectorAll("aside a")).map((a) =>
      a.getAttribute("href"),
    )

  beforeEach(() => {
    clearCache()
    localStorage.setItem("technocom.session", "active")
    localStorage.setItem("sales_portal_jwt", "test-token")
    container = document.createElement("div")
    document.body.appendChild(container)
  })

  afterEach(async () => {
    await act(async () => root?.unmount())
    container.remove()
    localStorage.clear()
    window.history.pushState({}, "", "/")
    db.session.userId = ADMIN
  })

  it("shows the admin the Users and Data Import links", async () => {
    await open("/", ADMIN)

    expect(navLinks()).toContain("/users")
    expect(navLinks()).toContain("/import")
  })

  it("hides the Users link from sales and keeps the Data Import link away from them too", async () => {
    await open("/", SALES)

    expect(navLinks()).not.toContain("/users")
    expect(navLinks()).not.toContain("/import")
    expect(navLinks()).toContain("/offers")
  })

  it("lets the accountant import data but not see Users", async () => {
    await open("/", ACCOUNTANT)

    expect(navLinks()).toContain("/import")
    expect(navLinks()).not.toContain("/users")
  })

  it("renders the Users screen for the admin", async () => {
    const text = await open("/users", ADMIN)

    expect(text).toContain("New user")
    expect(text).toContain("Youssef Ali")
    expect(text).toContain("Hassan Mahmoud")
  })

  // Each role is checked against somebody else's name: its own shows in the sidebar.
  it.each([
    ["sales", SALES, "Hassan Mahmoud"],
    ["accountant", ACCOUNTANT, "Youssef Ali"],
  ])("blocks the Users screen for %s", async (_name, userId, someoneElse) => {
    const text = await open("/users", userId)

    expect(text).toContain("You don't have access to this page")
    expect(text).not.toContain("New user")
    expect(text).not.toContain(someoneElse)
  })

  it("blocks the data import screen for sales", async () => {
    const text = await open("/import", SALES)

    expect(text).toContain("You don't have access to this page")
  })

  it("blocks the offer builder for the accountant", async () => {
    const text = await open("/offers/new", ACCOUNTANT)

    expect(text).toContain("You don't have access to this page")
  })

  it("shows the creator and creation time on every offer card", async () => {
    const text = await open("/offers", SALES)

    expect(text).toContain("Created by")
    expect(text).toContain("Amgad Anwar")
    expect(text).toContain("Loc/3089/YL/AA")
  })

  it("gives sales the New offer button and the accountant none", async () => {
    const sales = await open("/offers", SALES)
    expect(sales).toContain("Create new offer")

    await act(async () => root?.unmount())
    container.innerHTML = ""
    clearCache()

    const accountant = await open("/offers", ACCOUNTANT)
    expect(accountant).not.toContain("Create new offer")
    expect(accountant).toContain("Loc/3089/YL/AA")
  })

  it("lets sales add a customer but not edit one", async () => {
    const text = await open("/customers", SALES)

    expect(text).toContain("New customer")
    const editButtons = Array.from(container.querySelectorAll("button")).filter(
      (button) => button.textContent?.trim() === "Edit",
    )
    expect(editButtons).toHaveLength(0)
  })

  it("lets the accountant edit customers", async () => {
    await open("/customers", ACCOUNTANT)

    const editButtons = Array.from(container.querySelectorAll("button")).filter(
      (button) => button.textContent?.trim() === "Edit",
    )
    expect(editButtons.length).toBeGreaterThan(0)
  })
})
