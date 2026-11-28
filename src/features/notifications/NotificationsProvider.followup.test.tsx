// @vitest-environment jsdom

import { act, useState } from "react"

import { createRoot, type Root } from "react-dom/client"

import { BrowserRouter, useLocation, useNavigate } from "react-router-dom"

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  NotificationsProvider,
  useNotifications,
  type NotificationsValue,
} from "./NotificationsProvider"

import type { Notification } from "./types"

const state = vi.hoisted(() => ({ language: "en" as "en" | "ar" }))

const mocks = vi.hoisted(() => ({
  list: vi.fn(),

  markRead: vi.fn(),

  markAllRead: vi.fn(),

  onReady: vi.fn<(listener: () => void) => () => void>(() => () => {}),

  subscribeNotifications: vi.fn<(
    listener: (item: unknown) => void,
  ) => () => void>(() => () => {}),

  notify: vi.fn(),
}))

vi.mock("./api", () => ({
  notificationsApi: {
    list: mocks.list,

    markRead: mocks.markRead,

    markAllRead: mocks.markAllRead,
  },
}))

vi.mock("../../lib/live", () => ({
  live: {
    onReady: mocks.onReady,

    subscribeNotifications: mocks.subscribeNotifications,
  },
}))

vi.mock("../../components/ui/ToastProvider", () => ({
  useToast: () => ({ notify: mocks.notify }),
}))

vi.mock("../account/hooks/useSession", () => ({
  useSession: () => ({ authenticated: true }),
}))

vi.mock("../../i18n/I18nProvider", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string | number>) => {
      if (key === "notifications.types.offerCreated.description")
        return state.language === "ar"
          ? "أنشأ Actor العرض."
          : "Actor created offer."

      if (key === "notifications.open")
        return state.language === "ar" ? "فتح" : "Open"

      if (key === "notifications.toast.actor")
        return `User: ${params?.name ?? ""}`

      if (key === "notifications.toast.record")
        return `Record: ${params?.record ?? ""}`

      if (key === "notifications.toast.time")
        return `Time: ${params?.time ?? ""}`

      return key.replace(/\{(\w+)\}/g, (_, name: string) =>
        String(params?.[name] ?? ""),
      )
    },

    language: state.language,

    direction: state.language === "ar" ? "rtl" : "ltr",
  }),
}))
;(globalThis as {
  IS_REACT_ACT_ENVIRONMENT?: boolean
}).IS_REACT_ACT_ENVIRONMENT = true

function notification(): Notification {
  return {
    id: "n1",

    type: "offer.created",

    actorName: "Actor",

    entityType: "offer",

    entityId: "offer-1",

    entityLabel: "Loc/0001-2026/AA",

    meta: {},

    createdAt: "2026-11-27T09:15:00Z",

    readAt: null,
  }
}

function page(items: Notification[], unreadCount = items.length) {
  return { items, totalCount: items.length, unreadCount, page: 1, pageSize: 20 }
}

let container: HTMLDivElement

let root: Root | undefined

let view: NotificationsValue | undefined

function Probe() {
  view = useNotifications()

  return null
}

function Harness() {
  const navigate = useNavigate()

  const location = useLocation()

  const [, rerender] = useState(0)

  return (
    <>
      <span>{location.pathname}</span>
      <button type="button" onClick={() => navigate("/second")}>
        go
      </button>
      <button
        type="button"
        onClick={() => {
          state.language = state.language === "en" ? "ar" : "en"

          rerender((count) => count + 1)
        }}
      >
        lang
      </button>
      <NotificationsProvider>
        <Probe />
      </NotificationsProvider>
    </>
  )
}

async function settle() {
  await act(async () => {
    await Promise.resolve()
  })
}

async function click(element: Element) {
  await act(async () => {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true }))
  })
}

async function renderProvider() {
  container = document.createElement("div")

  document.body.appendChild(container)

  root = createRoot(container)

  await act(async () => {
    root!.render(
      <BrowserRouter>
        <Harness />
      </BrowserRouter>,
    )
  })

  await settle()
}

function setVisibility(value: "visible" | "hidden") {
  Object.defineProperty(document, "visibilityState", {
    value,

    configurable: true,
  })
}

describe("notifications follow-up", () => {
  beforeEach(() => {
    vi.resetAllMocks()

    vi.stubEnv("VITE_USE_MOCK", "false")

    state.language = "en"

    setVisibility("visible")

    window.history.pushState({}, "", "/first")

    mocks.onReady.mockReturnValue(() => {})

    mocks.subscribeNotifications.mockReturnValue(() => {})

    mocks.list.mockResolvedValue(page([]))

    mocks.markRead.mockResolvedValue(undefined)

    mocks.markAllRead.mockResolvedValue(undefined)
  })

  afterEach(async () => {
    await act(async () => root?.unmount())

    container.remove()

    setVisibility("visible")

    vi.unstubAllEnvs()
  })

  it("toast_description_contains_no_time", async () => {
    await renderProvider()

    const onNotification = mocks.subscribeNotifications.mock.calls[0][0]

    await act(async () => onNotification(notification()))

    expect(mocks.notify).toHaveBeenCalledTimes(1)

    expect(mocks.notify.mock.calls[0][2]).toBe("Actor created offer.")

    expect(mocks.notify.mock.calls[0][4]).toContain("Actor")

    expect(mocks.notify.mock.calls[0][4]).toContain("Loc/0001-2026/AA")
  })

  it("toast_action_opens_the_notification_and_marks_it_read", async () => {
    await renderProvider()

    const onNotification = mocks.subscribeNotifications.mock.calls[0][0]

    await act(async () => onNotification(notification()))

    const action = mocks.notify.mock.calls[0][3] as {
      label: string

      onClick: () => void
    }

    expect(action.label).toBe("Open")

    await act(async () => action.onClick())

    expect(mocks.markRead).toHaveBeenCalledWith("n1")

    expect(window.location.pathname).toBe("/offers/offer-1")
  })

  it("navigating_between_routes_causes_exactly_one_notificationsApi.list_call", async () => {
    await renderProvider()

    expect(mocks.list).toHaveBeenCalledTimes(1)

    await click(container.querySelector("button")!)

    await settle()

    expect(window.location.pathname).toBe("/second")

    expect(mocks.list).toHaveBeenCalledTimes(1)
  })

  it("language_switch_still_reformats_text", async () => {
    await renderProvider()

    await click(container.querySelectorAll("button")[1])

    await settle()

    const onNotification = mocks.subscribeNotifications.mock.calls[0][0]

    await act(async () => onNotification(notification()))

    expect(mocks.notify.mock.calls[0][2]).toBe("أنشأ Actor العرض.")

    expect(mocks.notify.mock.calls[0][3].label).toBe("فتح")
  })

  it("Second_tab_refetches_unread_count_when_it_becomes_visible", async () => {
    await renderProvider()

    expect(mocks.list).toHaveBeenCalledTimes(1)

    setVisibility("hidden")

    await act(async () => document.dispatchEvent(new Event("visibilitychange")))

    expect(mocks.list).toHaveBeenCalledTimes(1)

    mocks.list.mockResolvedValue(page([notification()], 1))

    setVisibility("visible")

    await act(async () => document.dispatchEvent(new Event("visibilitychange")))

    await settle()

    expect(mocks.list).toHaveBeenCalledTimes(2)

    expect(mocks.list).toHaveBeenLastCalledWith(1, 20)

    expect(view!.unreadCount).toBe(1)
  })
})
