import type { TranslateFunction } from "../../i18n/I18nProvider"

import type { TranslationKey, TranslationParams } from "../../i18n/types"

import { formatDateTime } from "../../lib/formatters/date"

import type { Locale } from "../../lib/formatters/locale"

import type { Notification, NotificationType } from "./types"

export type FormattedNotification = {
  title: string

  description: string

  time: string

  route?: string

  clickable: boolean
}

const TYPE_KEYS: Record<NotificationType, {
  title: TranslationKey

  description: TranslationKey
}> = {
  "offer.created": {
    title: "notifications.types.offerCreated.title",

    description: "notifications.types.offerCreated.description",
  },

  "offer.revised": {
    title: "notifications.types.offerRevised.title",

    description: "notifications.types.offerRevised.description",
  },

  "offer.status_changed": {
    title: "notifications.types.offerStatusChanged.title",

    description: "notifications.types.offerStatusChanged.description",
  },

  "offer.deleted": {
    title: "notifications.types.offerDeleted.title",

    description: "notifications.types.offerDeleted.description",
  },

  "customer.created": {
    title: "notifications.types.customerCreated.title",

    description: "notifications.types.customerCreated.description",
  },

  "customer.deleted": {
    title: "notifications.types.customerDeleted.title",

    description: "notifications.types.customerDeleted.description",
  },

  "material.created": {
    title: "notifications.types.materialCreated.title",

    description: "notifications.types.materialCreated.description",
  },

  "material.deleted": {
    title: "notifications.types.materialDeleted.title",

    description: "notifications.types.materialDeleted.description",
  },

  "bank.created": {
    title: "notifications.types.bankCreated.title",

    description: "notifications.types.bankCreated.description",
  },

  "bank.deleted": {
    title: "notifications.types.bankDeleted.title",

    description: "notifications.types.bankDeleted.description",
  },

  "import.committed": {
    title: "notifications.types.importCommitted.title",

    description: "notifications.types.importCommitted.description",
  },

  "user.created": {
    title: "notifications.types.userCreated.title",

    description: "notifications.types.userCreated.description",
  },

  "user.deactivated": {
    title: "notifications.types.userDeactivated.title",

    description: "notifications.types.userDeactivated.description",
  },

  "user.role_changed": {
    title: "notifications.types.userRoleChanged.title",

    description: "notifications.types.userRoleChanged.description",
  },
}

export function formatRelativeTime(
  value: string,

  t: TranslateFunction,

  locale: Locale,

  now = Date.now(),
): string {
  const timestamp = new Date(value).getTime()

  if (Number.isNaN(timestamp)) return formatDateTime(value, locale)

  const seconds = Math.max(0, Math.floor((now - timestamp) / 1000))

  if (seconds < 60) return t("notifications.time.justNow")

  const minutes = Math.floor(seconds / 60)

  if (minutes < 60)
    return t("notifications.time.minutesAgo", { count: minutes })

  const hours = Math.floor(minutes / 60)

  if (hours < 24) return t("notifications.time.hoursAgo", { count: hours })

  return t("notifications.time.daysAgo", { count: Math.floor(hours / 24) })
}

function routeFor(notification: Notification): string | undefined {
  if (notification.type.endsWith(".deleted")) return undefined

  switch (notification.type) {
    case "offer.created":

    case "offer.revised":

    case "offer.status_changed":
      return notification.entityId
        ? `/offers/${notification.entityId}`
        : "/offers"

    case "customer.created":
      return notification.entityId
        ? `/customers/${notification.entityId}`
        : "/customers"

    case "material.created":
      return "/products"

    case "bank.created":
      return "/banks"

    case "import.committed":
      // Sales receives import notices but cannot open /import; the dashboard is allowed for all.

      return "/"

    case "user.created":

    case "user.deactivated":

    case "user.role_changed":
      return "/users"

    default:
      return undefined
  }
}

function paramsFor(notification: Notification): TranslationParams {
  const meta = notification.meta

  return {
    actorName: notification.actorName,

    entityLabel: notification.entityLabel,

    from: String(meta.from ?? ""),

    to: String(meta.to ?? ""),

    role: String(meta.role ?? ""),

    customers: Number(meta.customers ?? 0),

    materials: Number(meta.materials ?? 0),

    banks: Number(meta.banks ?? 0),
  }
}

export function formatNotification(
  notification: Notification,

  t: TranslateFunction,

  locale: Locale,

  now = Date.now(),
): FormattedNotification {
  const keys = TYPE_KEYS[notification.type]

  const params = paramsFor(notification)

  const route = routeFor(notification)

  return {
    title: t(keys.title, params),

    description: t(keys.description, params),

    time: formatRelativeTime(notification.createdAt, t, locale, now),

    route,

    clickable: route !== undefined,
  }
}

/** Extra context revealed when the notification toast is expanded. */

export function formatNotificationDetails(
  notification: Notification,

  t: TranslateFunction,

  locale: Locale,

  now = Date.now(),
): string {
  return [
    t("notifications.toast.actor", {
      name: notification.actorName || t("audit.anonymous"),
    }),

    notification.entityLabel
      ? t("notifications.toast.record", { record: notification.entityLabel })
      : undefined,

    t("notifications.toast.time", {
      time: formatRelativeTime(notification.createdAt, t, locale, now),
    }),
  ]

    .filter(Boolean)

    .join("\n")
}
