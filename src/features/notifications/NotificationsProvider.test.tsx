// @vitest-environment jsdom
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  NotificationsProvider,
  useNotifications,
  type NotificationsValue,
} from "./NotificationsProvider"
import type { Notification } from "./types"

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  unreadCount: vi.fn(),
  markRead: vi.fn(),
  markAllRead: vi.fn(),
  onReady: vi.fn<(listener: () => void) => () => void>(() => () => {}),
  subscribeNotifications: vi.fn<(
    listener: (notification: Notification) => void,
  ) => () => void>(() => () => {}),
  notify: vi.fn(),
  navigate: vi.fn(),
  t: vi.fn((key: string, params?: Record<string, string | number>) =>
    key.replace(/\{(\w+)\}/g, (_, name: string) =>
      String(params?.[name] ?? ""),
    ),
  ),
}))

vi.mock("./api", () => ({
  notificationsApi: {
    list: mocks.list,
    unreadCount: mocks.unreadCount,
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

vi.mock("react-router-dom", () => ({
  useNavigate: () => mocks.navigate,
}))

vi.mock("../../i18n/I18nProvider", () => ({
  useTranslation: () => ({
    t: mocks.t,
    language: "en",
    direction: "ltr",
  }),
}))
;(globalThis as {
  IS_REACT_ACT_ENVIRONMENT?: boolean
}).IS_REACT_ACT_ENVIRONMENT = true

function notification(id: string, readAt: string | null = null): Notification {
  return {
    id,
    type: "offer.created",
    actorName: "Actor",
    entityType: "offer",
    entityId: "offer-1",
    entityLabel: "Loc/0001-2026/AA",
    meta: {},
    createdAt: new Date().toISOString(),
    readAt,
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

async function settle() {
  await act(async () => {
    await Promise.resolve()
  })
}

async function renderProvider() {
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => {
    root!.render(
      <NotificationsProvider>
        <Probe />
      </NotificationsProvider>,
    )
  })
  await settle()
}

describe("NotificationsProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv("VITE_USE_MOCK", "false")
    mocks.onReady.mockReturnValue(() => {})
    mocks.subscribeNotifications.mockReturnValue(() => {})
    mocks.list.mockResolvedValue(page([]))
    mocks.unreadCount.mockResolvedValue({ unreadCount: 0 })
  })

  afterEach(async () => {
    await act(async () => root?.unmount())
    container.remove()
    vi.unstubAllEnvs()
  })

  it("dedupes reconnect refetches and live notifications without a second toast", async () => {
    const first = notification("n1")
    mocks.list.mockResolvedValue(page([first], 1))
    mocks.unreadCount.mockResolvedValue({ unreadCount: 1 })
    await renderProvider()

    const onNotification = mocks.subscribeNotifications.mock.calls[0][0]
    const onReady = mocks.onReady.mock.calls[0][0]

    await act(async () => onNotification(first))
    expect(view!.items).toHaveLength(1)
    expect(view!.unreadCount).toBe(1)
    expect(mocks.notify).not.toHaveBeenCalled()

    await act(async () => onReady())
    await settle()
    expect(mocks.list).toHaveBeenCalledTimes(2)
    expect(view!.items).toHaveLength(1)
    expect(mocks.notify).not.toHaveBeenCalled()

    await act(async () => onNotification(notification("n2")))
    expect(view!.items).toHaveLength(2)
    expect(view!.unreadCount).toBe(2)
    expect(mocks.notify).toHaveBeenCalledTimes(1)
  })

  it("marks one notification read and rolls back when the API fails", async () => {
    const first = notification("n1")
    const second = notification("n2")
    mocks.list.mockResolvedValue(page([first, second], 2))
    mocks.unreadCount.mockResolvedValue({ unreadCount: 2 })
    await renderProvider()

    await act(async () => view!.markAsRead("n1"))
    expect(mocks.markRead).toHaveBeenCalledWith("n1")
    expect(view!.unreadCount).toBe(1)
    expect(view!.items.find((item) => item.id === "n1")!.readAt).not.toBeNull()

    mocks.markRead.mockRejectedValueOnce(new Error("offline"))
    await act(async () => view!.markAsRead("n2"))
    expect(view!.unreadCount).toBe(1)
    expect(view!.items.find((item) => item.id === "n2")!.readAt).toBeNull()
    expect(mocks.notify).toHaveBeenCalledWith(
      "notifications.writeFailed",
      "error",
    )
  })

  it("restores the full unread count when mark-all fails", async () => {
    mocks.list.mockResolvedValue(
      page([notification("n1"), notification("n2")], 35),
    )
    await renderProvider()
    expect(view!.unreadCount).toBe(35)

    mocks.markAllRead.mockRejectedValueOnce(new Error("offline"))
    await act(async () => view!.markAllRead())

    expect(view!.unreadCount).toBe(35)
    expect(view!.items.every((item) => item.readAt === null)).toBe(true)
  })

  it("waits for an in-flight read before resyncing", async () => {
    mocks.list.mockResolvedValue(
      page([notification("n1"), notification("n2")], 2),
    )
    await renderProvider()
    expect(view!.unreadCount).toBe(2)

    let resolveRead: () => void
    mocks.markRead.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveRead = resolve
      }),
    )
    let read: Promise<void>
    await act(async () => {
      read = view!.markAsRead("n1")
    })
    expect(view!.unreadCount).toBe(1)

    const onReady = mocks.onReady.mock.calls[0][0]
    await act(async () => onReady())
    expect(mocks.list).toHaveBeenCalledTimes(1)

    mocks.list.mockResolvedValue(
      page(
        [notification("n1", new Date().toISOString()), notification("n2")],
        1,
      ),
    )
    await act(async () => {
      resolveRead()
      await read
    })
    await settle()

    expect(mocks.list).toHaveBeenCalledTimes(2)
    expect(view!.unreadCount).toBe(1)
  })

  it("ignores a resync snapshot when a second read starts during the wait", async () => {
    mocks.list.mockResolvedValue(
      page([notification("n1"), notification("n2")], 2),
    )
    await renderProvider()
    expect(view!.unreadCount).toBe(2)

    let resolveA: () => void
    let resolveB: () => void
    mocks.markRead
      .mockReturnValueOnce(
        new Promise<void>((resolve) => {
          resolveA = resolve
        }),
      )
      .mockReturnValueOnce(
        new Promise<void>((resolve) => {
          resolveB = resolve
        }),
      )

    let readA: Promise<void>
    await act(async () => {
      readA = view!.markAsRead("n1")
    })
    expect(view!.unreadCount).toBe(1)

    const onReady = mocks.onReady.mock.calls[0][0]
    await act(async () => onReady())
    expect(mocks.list).toHaveBeenCalledTimes(1)

    let readB: Promise<void>
    await act(async () => {
      readB = view!.markAsRead("n2")
    })
    expect(view!.unreadCount).toBe(0)

    await act(async () => {
      resolveA()
      await readA
    })
    await settle()
    expect(mocks.list).toHaveBeenCalledTimes(2)
    expect(view!.unreadCount).toBe(0)

    await act(async () => {
      resolveB()
      await readB
    })
  })

  it("reports a failed load and reloads on retry", async () => {
    mocks.list.mockRejectedValueOnce(new Error("offline"))
    await renderProvider()
    expect(view!.error).toBe(true)
    expect(view!.items).toEqual([])

    mocks.list.mockResolvedValue(page([notification("n1")], 1))
    await act(async () => view!.retry())
    await settle()

    expect(view!.error).toBe(false)
    expect(view!.items).toHaveLength(1)
    expect(view!.unreadCount).toBe(1)
  })

  it("does not double-count an arrival already in the page snapshot", async () => {
    let resolvePage: (value: ReturnType<typeof page>) => void
    mocks.list.mockReturnValue(
      new Promise<ReturnType<typeof page>>((resolve) => {
        resolvePage = resolve
      }),
    )
    await renderProvider()

    const onNotification = mocks.subscribeNotifications.mock.calls[0][0]
    await act(async () => onNotification(notification("n1")))
    expect(view!.unreadCount).toBe(1)

    await act(async () => {
      resolvePage(page([notification("n1")], 5))
      await Promise.resolve()
    })

    expect(view!.unreadCount).toBe(5)
    expect(view!.items).toHaveLength(1)
  })

  it("adds arrivals missing from a stale page snapshot", async () => {
    let resolvePage: (value: ReturnType<typeof page>) => void
    mocks.list.mockReturnValue(
      new Promise<ReturnType<typeof page>>((resolve) => {
        resolvePage = resolve
      }),
    )
    await renderProvider()

    const onNotification = mocks.subscribeNotifications.mock.calls[0][0]
    await act(async () => onNotification(notification("n1")))
    await act(async () => {
      resolvePage(page([], 5))
      await Promise.resolve()
    })

    expect(view!.unreadCount).toBe(6)
  })

  it("does not let a stale resync restore read rows or their count", async () => {
    mocks.list.mockResolvedValue(
      page([notification("n1"), notification("n2")], 2),
    )
    await renderProvider()
    expect(view!.items).toHaveLength(2)

    let resolvePage: (value: ReturnType<typeof page>) => void
    mocks.list.mockReturnValueOnce(
      new Promise<ReturnType<typeof page>>((resolve) => {
        resolvePage = resolve
      }),
    )
    const onReady = mocks.onReady.mock.calls[0][0]
    await act(async () => onReady())

    await act(async () => view!.markAllRead())
    expect(view!.unreadCount).toBe(0)

    await act(async () => {
      resolvePage(page([notification("n1"), notification("n2")], 2))
      await Promise.resolve()
    })

    expect(view!.unreadCount).toBe(0)
    expect(view!.items.every((item) => item.readAt !== null)).toBe(true)
  })

  it("marks the whole inbox read", async () => {
    mocks.list.mockResolvedValue(
      page([notification("n1"), notification("n2")], 2),
    )
    mocks.unreadCount.mockResolvedValue({ unreadCount: 2 })
    await renderProvider()

    await act(async () => view!.markAllRead())
    expect(mocks.markAllRead).toHaveBeenCalledTimes(1)
    expect(view!.unreadCount).toBe(0)
    expect(view!.items.every((item) => item.readAt !== null)).toBe(true)
  })

  it("marks all read even when unread rows are outside the loaded page", async () => {
    mocks.list.mockResolvedValue(page([], 0))
    mocks.unreadCount.mockResolvedValue({ unreadCount: 3 })
    await renderProvider()

    await act(async () => view!.markAllRead())

    expect(mocks.markAllRead).toHaveBeenCalledTimes(1)
    expect(view!.unreadCount).toBe(0)
  })

  it("does nothing in mock mode", async () => {
    vi.stubEnv("VITE_USE_MOCK", "true")
    await renderProvider()

    expect(view!.items).toEqual([])
    expect(view!.unreadCount).toBe(0)
    expect(mocks.list).not.toHaveBeenCalled()
    expect(mocks.unreadCount).not.toHaveBeenCalled()
    expect(mocks.subscribeNotifications).not.toHaveBeenCalled()
  })
})
