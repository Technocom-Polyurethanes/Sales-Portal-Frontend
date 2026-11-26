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
  markAsRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
}

const NotificationsContext = createContext<NotificationsValue | null>(null)

function mergeItems(current: Notification[], incoming: Notification[]): Notification[] {
  const byId = new Map(current.map((item) => [item.id, item]))
  for (const item of incoming) byId.set(item.id, item)
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
  const itemsRef = useRef(items)
  const knownIdsRef = useRef(new Set<string>())

  useEffect(() => {
    itemsRef.current = items
    knownIdsRef.current = new Set(items.map((item) => item.id))
  }, [items])

  const markAsRead = useCallback(async (id: string) => {
    const previous = itemsRef.current.find((item) => item.id === id)
    if (!previous || previous.readAt) return

    const stamp = new Date().toISOString()
    const optimistic = itemsRef.current.map((item) =>
      item.id === id ? { ...item, readAt: stamp } : item,
    )
    itemsRef.current = optimistic
    setItems(optimistic)
    setUnreadCount((count) => Math.max(0, count - 1))

    try {
      await notificationsApi.markRead(id)
    } catch {
      itemsRef.current = itemsRef.current.map((item) =>
        item.id === id ? { ...item, readAt: previous.readAt } : item,
      )
      setItems(itemsRef.current)
      setUnreadCount((count) => count + 1)
    }
  }, [])

  const markAllRead = useCallback(async () => {
    const previous = itemsRef.current
    if (previous.every((item) => item.readAt)) return

    const stamp = new Date().toISOString()
    const optimistic = previous.map((item) => ({ ...item, readAt: item.readAt ?? stamp }))
    itemsRef.current = optimistic
    setItems(optimistic)
    setUnreadCount(0)

    try {
      await notificationsApi.markAllRead()
    } catch {
      itemsRef.current = previous
      setItems(previous)
      setUnreadCount(previous.filter((item) => !item.readAt).length)
    }
  }, [])

  const disabled = isMockApi() || !authenticated

  useEffect(() => {
    if (disabled) {
      itemsRef.current = []
      knownIdsRef.current = new Set()
      setItems([])
      setUnreadCount(0)
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)

    const load = async () => {
      try {
        const [page, count] = await Promise.all([
          notificationsApi.list(1, PAGE_SIZE),
          notificationsApi.unreadCount(),
        ])
        if (!active) return
        setItems((current) => mergeItems(current, page.items))
        setUnreadCount(count.unreadCount)
      } catch {
        // A failed resync leaves the last known inbox intact.
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()

    const stopReady = live.onReady(() => {
      void load()
    })

    const stopNotification = live.subscribeNotifications((incoming: LiveNotification) => {
      if (!isNotification(incoming) || knownIdsRef.current.has(incoming.id)) return
      knownIdsRef.current.add(incoming.id)

      setItems((current) => [incoming, ...current.filter((item) => item.id !== incoming.id)])
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
    })

    return () => {
      active = false
      stopReady()
      stopNotification()
    }
  }, [disabled, t, locale, notify, navigate, markAsRead])

  const value = useMemo(
    () => ({ items, unreadCount, loading, markAsRead, markAllRead }),
    [items, unreadCount, loading, markAsRead, markAllRead],
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
    throw new Error("useNotifications must be used inside <NotificationsProvider>")
  return context
}
