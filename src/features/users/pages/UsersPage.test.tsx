// @vitest-environment jsdom
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import "@/mock"
import App from "../../../app/App"
import { clearCache } from "../../../lib/cache/queryCache"
import { accounts } from "../../../mock/data/accounts"
import { db } from "../../../mock/db"

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

// Sileo (the toasts) observes its size; jsdom has no ResizeObserver.
if (!("ResizeObserver" in globalThis)) {
  globalThis.ResizeObserver = (class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver)
}

const pause = (ms: number) =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms))
  })

function setValue(
  element: HTMLInputElement | HTMLSelectElement,
  value: string,
) {
  const prototype =
    element instanceof HTMLSelectElement
      ? HTMLSelectElement.prototype
      : HTMLInputElement.prototype
  Object.getOwnPropertyDescriptor(prototype, "value")!.set!.call(element, value)
  element.dispatchEvent(
    new Event(element instanceof HTMLSelectElement ? "change" : "input", {
      bubbles: true,
    }),
  )
}

describe("Users screen", () => {
  let container: HTMLDivElement
  let root: Root

  const idle = async () => {
    await pause(150)
    for (let tries = 0; tries < 40; tries += 1) {
      if (!document.querySelector('[aria-busy="true"]')) break
      await pause(100)
    }
    await pause(50)
  }

  const field = <T extends HTMLElement>(id: string) =>
    document.getElementById(id) as unknown as T

  // The last match: a dialog is rendered after the page, so its buttons come last.
  const button = (label: string) =>
    Array.from(document.querySelectorAll("button"))
      .filter((candidate) => candidate.textContent?.trim() === label)
      .pop() as HTMLButtonElement

  const click = async (element: Element) => {
    await act(async () => {
      element.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })
  }

  const fillNewUser = async (username: string, password: string) => {
    await click(button("New user"))
    await act(async () => {
      setValue(field("user-full-name"), "Mona Said")
      setValue(field("user-username"), username)
      setValue(field("user-role"), "Accountant")
      setValue(field("user-password"), password)
    })
  }

  beforeEach(async () => {
    clearCache()
    db.accounts.splice(0, db.accounts.length, ...structuredClone(accounts))
    db.session.userId = "acct-admin"
    localStorage.setItem("technocom.session", "active")
    localStorage.setItem("sales_portal_jwt", "test-token")
    window.history.pushState({}, "", "/users")
    container = document.createElement("div")
    document.body.appendChild(container)
    root = createRoot(container)
    await act(async () => {
      root.render(<App />)
    })
    await idle()
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    localStorage.clear()
    window.history.pushState({}, "", "/")
  })

  it("creates a user with a role and a password and shows the new card", async () => {
    await fillNewUser("mona", "secret-pass-1")
    // The initials were suggested from the name.
    expect(field<HTMLInputElement>("user-initials").value).toBe("MS")

    await click(button("Save"))
    await idle()

    const created = db.accounts.find((user) => user.username === "mona")
    expect(created?.role).toBe("Accountant")
    expect(created?.initials).toBe("MS")
    expect(document.body.textContent).toContain("Mona Said")
    expect(document.getElementById("user-full-name")).toBeNull()
  })

  it("marks the fields instead of saving when the form is incomplete", async () => {
    await click(button("New user"))
    await click(button("Save"))
    await pause(100)

    expect(document.body.textContent).toContain(
      "Fill in the highlighted fields.",
    )
    expect(document.body.textContent).toContain("At least 8 characters")
    expect(db.accounts).toHaveLength(3)
  })

  it("shows the server message on the username when it is taken", async () => {
    await fillNewUser("Hassan", "secret-pass-1")
    await click(button("Save"))
    await idle()

    expect(document.body.textContent).toContain(
      "This username is already taken.",
    )
    expect(db.accounts).toHaveLength(3)
  })

  it("deactivates another user but offers no deactivate on your own card", async () => {
    // Amgad (you) has no Deactivate button; the other two do.
    const deactivate = Array.from(document.querySelectorAll("button")).filter(
      (candidate) => candidate.textContent?.trim() === "Deactivate",
    )
    expect(deactivate).toHaveLength(2)

    await click(deactivate[0])
    await idle()

    expect(db.accounts.filter((user) => !user.isActive)).toHaveLength(1)
    expect(document.body.textContent).toContain("Inactive")
  })

  it("filters the cards by role", async () => {
    await act(async () => {
      setValue(
        document.querySelector(
          'select[aria-label="Role"]',
        ) as HTMLSelectElement,
        "Sales",
      )
    })
    await idle()

    const cards = document.querySelectorAll("article")
    expect(cards).toHaveLength(1)
    expect(cards[0].textContent).toContain("Youssef Ali")
  })

  it("resets a password after checking its length", async () => {
    const reset = Array.from(document.querySelectorAll("button")).filter(
      (candidate) => candidate.textContent?.trim() === "Reset password",
    )
    await click(reset[0])
    await act(async () => {
      setValue(field("reset-password"), "short")
    })
    await click(button("Reset password"))
    await pause(100)
    expect(document.body.textContent).toContain("At least 8 characters")

    await act(async () => {
      setValue(field("reset-password"), "a-long-enough-one")
    })
    await click(button("Reset password"))
    await idle()
    expect(document.getElementById("reset-password")).toBeNull()
  })
})
