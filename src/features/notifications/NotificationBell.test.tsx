// @vitest-environment jsdom
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import NotificationBell from "./NotificationBell"
import type { Notification } from "./types"

const state = vi.hoisted(() => ({
  items: [] as unknown[],
  unreadCount: 0,
  loading: false,
  error: false,
  retry: vi.fn(),
  language: "en",
  direction: "ltr",
  markAsRead: vi.fn(async (_id: string) => {}),
  markAllRead: vi.fn(async () => {}),
  navigate: vi.fn(),
  t: vi.fn((key: string, params?: Record<string, string | number>) =>
    key.replace(/\{(\w+)\}/g, (_, name: string) =>
      String(params?.[name] ?? ""),
    ),
  ),
}))

vi.mock("./NotificationsProvider", () => ({
  useNotifications: () => ({
    items: state.items,
    unreadCount: state.unreadCount,
    loading: state.loading,
    error: state.error,
    retry: state.retry,
    markAsRead: state.markAsRead,
    markAllRead: state.markAllRead,
  }),
}))

vi.mock("../../i18n/I18nProvider", () => ({
  useTranslation: () => ({
    t: state.t,
    language: state.language,
    direction: state.direction,
  }),
}))

vi.mock("react-router-dom", () => ({
  useNavigate: () => state.navigate,
}))

vi.mock("../../lib/api/mode", () => ({
  isMockApi: () => false,
}))
;(globalThis as {
  IS_REACT_ACT_ENVIRONMENT?: boolean
}).IS_REACT_ACT_ENVIRONMENT = true

function notification(type: Notification["type"]): Notification {
  return {
    id: "n1",
    type,
    actorName: "Actor",
    entityType: "offer",
    entityId: "offer-1",
    entityLabel: "Loc/0001-2026/AA",
    meta: {},
    createdAt: new Date().toISOString(),
    readAt: null,
  }
}

let container: HTMLDivElement
let root: Root | undefined

async function renderBell() {
  root = createRoot(container)
  await act(async () => {
    root!.render(<NotificationBell />)
  })
}

async function click(element: Element) {
  await act(async () => {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true }))
  })
}

describe("NotificationBell", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    state.items = []
    state.unreadCount = 0
    state.loading = false
    state.error = false
    state.language = "en"
    state.direction = "ltr"
    container = document.createElement("div")
    document.body.appendChild(container)
  })

  afterEach(async () => {
    await act(async () => root?.unmount())
    container.remove()
  })

  it("caps the badge and closes the panel on Escape", async () => {
    state.unreadCount = 120
    await renderBell()

    const bell = container.querySelector("button")!
    expect(bell.textContent).toContain("99+")
    expect(bell.getAttribute("aria-expanded")).toBe("false")
    expect(bell.getAttribute("aria-label")).toContain("notifications.unread")

    await click(bell)
    expect(bell.getAttribute("aria-expanded")).toBe("true")
    expect(container.querySelector('[role="dialog"]')).not.toBeNull()

    await act(async () => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      )
    })
    expect(container.querySelector('[role="dialog"]')).toBeNull()
    expect(document.activeElement).toBe(bell)
  })

  it("shows skeleton rows while loading", async () => {
    state.loading = true
    await renderBell()
    await click(container.querySelector("button")!)

    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(12)
    expect(container.querySelector("li")).toBeNull()
  })

  it("marks a notification read and navigates when its row is clicked", async () => {
    state.items = [notification("offer.created")]
    state.unreadCount = 1
    await renderBell()
    await click(container.querySelector("button")!)

    const row = container.querySelector("li button")!
    expect(row).not.toBeNull()
    await click(row)

    expect(state.markAsRead).toHaveBeenCalledWith("n1")
    expect(state.navigate).toHaveBeenCalledWith("/offers/offer-1")
  })

  it("shows a retry action when the inbox failed to load", async () => {
    state.error = true
    await renderBell()
    await click(container.querySelector("button")!)

    expect(container.querySelector('[role="alert"]')).not.toBeNull()
    const retryButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "common.retry",
    )!
    await click(retryButton)
    expect(state.retry).toHaveBeenCalledTimes(1)
  })

  it("restores focus to the bell when a row or the outside area closes the panel", async () => {
    state.items = [notification("offer.created")]
    await renderBell()
    const bell = container.querySelector("button")!
    await click(bell)
    await click(container.querySelector("li button")!)
    expect(document.activeElement).toBe(bell)

    await click(bell)
    await act(async () => {
      document.dispatchEvent(new Event("pointerdown", { bubbles: true }))
    })
    expect(document.activeElement).toBe(bell)
  })

  it("routes import notices to a page every role can open", async () => {
    state.items = [notification("import.committed")]
    await renderBell()
    await click(container.querySelector("button")!)

    await click(container.querySelector("li button")!)
    expect(state.navigate).toHaveBeenCalledWith("/")
  })

  it("renders deleted notifications without a click action", async () => {
    state.items = [notification("offer.deleted")]
    await renderBell()
    await click(container.querySelector("button")!)

    expect(container.querySelector("li button")).toBeNull()
    expect(container.textContent).toContain(
      "notifications.types.offerDeleted.title",
    )
  })

  it("mirrors the panel for Arabic", async () => {
    state.language = "ar"
    state.direction = "rtl"
    await renderBell()
    await click(container.querySelector("button")!)

    expect(
      container.querySelector('[role="dialog"]')!.getAttribute("dir"),
    ).toBe("rtl")
  })
})
