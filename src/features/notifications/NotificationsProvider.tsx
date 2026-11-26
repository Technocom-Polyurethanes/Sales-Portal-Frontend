import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import type { ReactNode } from "react"
import { useNavigate } from "react-router-dom"

import { useToast } from "../../components/ui/ToastProvider"
import { useTranslation } from "../../i18n/I18nProvider"
import { isMockApi } from "../../lib/api/mode"
import { localeForLanguage } from "../../lib/formatters/locale"
import { live, type LiveNotification } from "../../lib/live"
import { useSession } from "../account/hooks/useSession"

import { notificationsApi } from "./api"
import { formatNotification } from "./formatters"
import { isNotification, type Notification } from "./types"

const PAGE_SIZE = 20

export type NotificationsValue = {
  items: Notification[]
  unreadCount: number
  loading: boolean
  error: boolean
  retry: () => void
  markAsRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
}

const NotificationsContext = createContext<NotificationsValue | null>(null)

function mergeItems(
  current: Notification[],
  incoming: Notification[],
): Notification[] {
  const byId = new Map(current.map((item) => [item.id, item]))
  for (const item of incoming) {
    const existing = byId.get(item.id)
    // A stale page response must not undo a read the user just made locally.
    byId.set(
      item.id,
      existing?.readAt && !item.readAt
        ? { ...item, readAt: existing.readAt }
        : item,
    )
  }
  return [...byId.values()].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  )
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { authenticated } = useSession()
  const { t, language } = useTranslation()
  const { notify } = useToast()
  const navigate = useNavigate()
  const locale = localeForLanguage(language)

  const [items, setItems] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [retryToken, setRetryToken] = useState(0)
  const itemsRef = useRef(items)
  const unreadCountRef = useRef(unreadCount)
  const knownIdsRef = useRef(new Set<string>())
  const arrivalIdsRef = useRef<string[]>([])
  const readsRef = useRef(0)
  const pendingWritesRef = useRef(new Set<Promise<unknown>>())

  useEffect(() => {
    itemsRef.current = items
    knownIdsRef.current = new Set(items.map((item) => item.id))
  }, [items])

  useEffect(() => {
    unreadCountRef.current = unreadCount
  }, [unreadCount])

  const markAsRead = useCallback(
    async (id: string) => {
      const previous = itemsRef.current.find((item) => item.id === id)
      if (!previous || previous.readAt) return
      readsRef.current += 1

      const stamp = new Date().toISOString()
      const optimistic = itemsRef.current.map((item) =>
        item.id === id ? { ...item, readAt: stamp } : item,
      )
      itemsRef.current = optimistic
      setItems(optimistic)
      setUnreadCount((count) => Math.max(0, count - 1))

      const write = notificationsApi.markRead(id)
      pendingWritesRef.current.add(write)
      try {
        await write
      } catch {
        // Revert only this row: a notification may have arrived while the request was in flight.
        const reverted = itemsRef.current.map((item) =>
          item.id === id ? { ...item, readAt: previous.readAt } : item,
        )
        itemsRef.current = reverted
        readsRef.current -= 1
        setItems(reverted)
        setUnreadCount((count) => count + 1)
        notify(t("notifications.writeFailed"), "error")
      } finally {
        pendingWritesRef.current.delete(write)
      }
    },
    [notify, t],
  )

  const markAllRead = useCallback(async () => {
    const changedIds = new Set(
      itemsRef.current.filter((item) => !item.readAt).map((item) => item.id),
    )
    const countBefore = unreadCountRef.current
    readsRef.current += changedIds.size

    const stamp = new Date().toISOString()
    const optimistic = itemsRef.current.map((item) => ({
      ...item,
      readAt: item.readAt ?? stamp,
    }))
    itemsRef.current = optimistic
    setItems(optimistic)
    setUnreadCount(0)

    const write = notificationsApi.markAllRead()
    pendingWritesRef.current.add(write)
    try {
      await write
    } catch {
      const reverted = itemsRef.current.map((item) =>
        changedIds.has(item.id) ? { ...item, readAt: null } : item,
      )
      itemsRef.current = reverted
      readsRef.current -= changedIds.size
      setItems(reverted)
      // The server count may include unread rows outside the loaded page.
      setUnreadCount((count) => count + countBefore)
      notify(t("notifications.writeFailed"), "error")
    } finally {
      pendingWritesRef.current.delete(write)
    }
  }, [notify, t])

  const disabled = isMockApi() || !authenticated

  useEffect(() => {
    if (disabled) {
      itemsRef.current = []
      knownIdsRef.current = new Set()
      setItems([])
      setUnreadCount(0)
      setLoading(false)
      setError(false)
      return
    }

    let active = true

    const load = async () => {
      const pendingWrites = [...pendingWritesRef.current]
      if (pendingWrites.length > 0) await Promise.allSettled(pendingWrites)
      if (!active) return

      const arrivalsAtStart = arrivalIdsRef.current.length
      const readsAtStart = readsRef.current
      setLoading(itemsRef.current.length === 0)
      try {
        const page = await notificationsApi.list(1, PAGE_SIZE)
        if (!active) return
        setItems((current) => mergeItems(current, page.items))
        const pageIds = new Set(page.items.map((item) => item.id))
        const uncounted = arrivalIdsRef.current
          .slice(arrivalsAtStart)
          .filter((id) => !pageIds.has(id)).length
        // The page count and its rows share one snapshot; only arrivals missing from that
        // snapshot need adding. Reads stay with the optimistic path.
        if (readsRef.current === readsAtStart) {
          setUnreadCount(Math.max(0, page.unreadCount + uncounted))
        }
        setError(false)
      } catch {
        if (active) setError(true)
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()

    const stopReady = live.onReady(() => {
      void load()
    })

    const stopNotification = live.subscribeNotifications(
      (incoming: LiveNotification) => {
        if (!isNotification(incoming) || knownIdsRef.current.has(incoming.id))
          return
        knownIdsRef.current.add(incoming.id)
        arrivalIdsRef.current.push(incoming.id)

        setItems((current) => [
          incoming,
          ...current.filter((item) => item.id !== incoming.id),
        ])
        setUnreadCount((count) => count + 1)

        const formatted = formatNotification(incoming, t, locale)
        const description = `${formatted.description} · ${formatted.time}`
        notify(
          formatted.title,
          "info",
          description,
          formatted.route
            ? {
                label: t("notifications.markRead"),
                onClick: () => {
                  void markAsRead(incoming.id)
                  navigate(formatted.route!)
                },
              }
            : undefined,
        )
      },
    )

    return () => {
      active = false
      stopReady()
      stopNotification()
    }
  }, [disabled, t, locale, notify, navigate, markAsRead, retryToken])

  const retry = useCallback(() => setRetryToken((token) => token + 1), [])

  const value = useMemo(
    () => ({
      items,
      unreadCount,
      loading,
      error,
      retry,
      markAsRead,
      markAllRead,
    }),
    [items, unreadCount, loading, error, retry, markAsRead, markAllRead],
  )

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications(): NotificationsValue {
  const context = useContext(NotificationsContext)
  if (!context)
    throw new Error(
      "useNotifications must be used inside <NotificationsProvider>",
    )
  return context
}
