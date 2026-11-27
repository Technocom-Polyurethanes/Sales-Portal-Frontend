import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"

import Button from "../../components/ui/Button"
import EmptyState from "../../components/ui/EmptyState"
import Icon from "../../components/ui/Icon"
import Skeleton from "../../components/ui/Skeleton"
import { useTranslation } from "../../i18n/I18nProvider"
import { isMockApi } from "../../lib/api/mode"
import { formatDateTime } from "../../lib/formatters/date"
import { localeForLanguage } from "../../lib/formatters/locale"
import { useFocusTrap } from "../../lib/hooks/useFocusTrap"

import { formatNotification } from "./formatters"
import { useNotifications } from "./NotificationsProvider"

export default function NotificationBell() {
  const { items, unreadCount, loading, error, retry, markAsRead, markAllRead } =
    useNotifications()
  const { t, language, direction } = useTranslation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [now, setNow] = useState(Date.now())
  const wrapper = useRef<HTMLDivElement>(null)
  const bell = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const locale = localeForLanguage(language)
  useFocusTrap(open, panel)

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: PointerEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    setNow(Date.now())
    const timer = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(timer)
  }, [open])

  const formatted = useMemo(
    () =>
      items.map((item) => ({
        item,
        ...formatNotification(item, t, locale, now),
      })),
    [items, t, locale, now],
  )

  if (isMockApi()) return null

  const label =
    unreadCount > 0
      ? t("notifications.unread", { count: unreadCount })
      : t("notifications.title")

  return (
    <div ref={wrapper} className="relative">
      <button
        ref={bell}
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls="notifications-panel"
        onClick={() => {
          bell.current?.focus()
          setOpen((current) => !current)
        }}
        className="relative flex h-9 w-9 items-center justify-center rounded-md border border-line text-muted transition-colors hover:bg-page hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <Icon name="bell" size={18} />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute -end-2 -top-2 min-w-5 rounded-full bg-primary px-1 text-center text-xs font-semibold leading-5 text-on-primary"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          id="notifications-panel"
          ref={panel}
          role="dialog"
          aria-label={t("notifications.title")}
          dir={direction}
          tabIndex={-1}
          className="fixed inset-x-4 top-16 z-40 max-h-[min(30rem,calc(100vh-5rem))] overflow-hidden rounded-lg border border-line bg-surface shadow-xl focus:outline-none motion-safe:animate-panel-in sm:absolute sm:start-auto sm:end-0 sm:top-11 sm:w-96"
        >
          <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
            <strong className="text-sm font-semibold text-ink">
              {t("notifications.title")}
            </strong>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => void markAllRead()}
                >
                  {t("notifications.markAllRead")}
                </Button>
              )}
              <button
                type="button"
                aria-label={t("common.close")}
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-page hover:text-ink focus-visible:outline-2 focus-visible:outline-primary"
              >
                <Icon name="close" size={16} />
              </button>
            </div>
          </div>

          <div
            className="max-h-[min(24rem,calc(100vh-9rem))] overflow-y-auto"
            aria-busy={loading}
          >
            {loading && (
              <span role="status" className="sr-only">
                {t("notifications.loading")}
              </span>
            )}
            {error && !loading && (
              <div
                role="alert"
                className="flex items-center justify-between gap-2 border-b border-line px-4 py-3 text-xs text-danger"
              >
                <span>{t("notifications.loadFailed")}</span>
                <Button type="button" size="sm" variant="ghost" onClick={retry}>
                  {t("common.retry")}
                </Button>
              </div>
            )}
            {loading ? (
              <div className="space-y-4 p-4">
                {[0, 1, 2, 3].map((row) => (
                  <div key={row} className="flex items-start gap-3">
                    <Skeleton className="mt-1 h-2 w-2" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : formatted.length === 0 ? (
              <EmptyState
                title={t("notifications.empty")}
                icon={<Icon name="bell" size={28} />}
              />
            ) : (
              <ul className="divide-y divide-line">
                {formatted.map(
                  ({ item, title, description, time, route, clickable }) => {
                    const content = (
                      <span className="flex w-full items-start gap-2 text-start">
                        {!item.readAt && (
                          <span
                            aria-hidden="true"
                            className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"
                          />
                        )}
                        <span className="min-w-0 flex-1">
                          <span
                            title={title}
                            className={`block truncate text-sm ${
                              item.readAt
                                ? "font-normal text-muted"
                                : "font-semibold text-ink"
                            }`}
                          >
                            {title}
                          </span>
                          <span className="mt-0.5 block break-words text-xs text-muted">
                            {description}
                          </span>
                        </span>
                        <span
                          title={formatDateTime(item.createdAt, locale)}
                          className="shrink-0 text-xs text-muted"
                        >
                          {time}
                        </span>
                      </span>
                    )

                    return (
                      <li key={item.id}>
                        {clickable && route ? (
                          <button
                            type="button"
                            aria-label={`${
                              item.readAt
                                ? ""
                                : `${t("notifications.unreadItem")}. `
                            }${title}. ${description}`}
                            onClick={() => {
                              void markAsRead(item.id)
                              setOpen(false)
                              navigate(route)
                            }}
                            className="flex w-full px-4 py-3 text-start transition-colors hover:bg-page focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                          >
                            {content}
                          </button>
                        ) : (
                          <div className="flex px-4 py-3">{content}</div>
                        )}
                      </li>
                    )
                  },
                )}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
