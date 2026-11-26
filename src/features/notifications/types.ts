import type { LiveNotification } from "../../lib/live"

/** The 14 event types shared with the backend. */
export const NOTIFICATION_TYPES = [
  "offer.created",
  "offer.revised",
  "offer.status_changed",
  "offer.deleted",
  "customer.created",
  "customer.deleted",
  "material.created",
  "material.deleted",
  "bank.created",
  "bank.deleted",
  "import.committed",
  "user.created",
  "user.deactivated",
  "user.role_changed",
] as const

export type NotificationType = (typeof NOTIFICATION_TYPES)[number]

export type Notification = Omit<LiveNotification, "type"> & {
  type: NotificationType
}

export type NotificationPage = {
  items: Notification[]
  totalCount: number
  unreadCount: number
  page: number
  pageSize: number
}

export function isNotification(value: LiveNotification): value is Notification {
  return (NOTIFICATION_TYPES as readonly string[]).includes(value.type)
}
