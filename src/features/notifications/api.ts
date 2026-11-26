import { api } from "../../lib/api/client"

import type { NotificationPage } from "./types"

export const notificationsApi = {
  list(page = 1, pageSize = 20, unreadOnly = false): Promise<NotificationPage> {
    return api.get<NotificationPage>("/notifications", {
      page,
      pageSize,
      unreadOnly,
    })
  },

  unreadCount(): Promise<{ unreadCount: number }> {
    return api.get<{ unreadCount: number }>("/notifications/unread-count")
  },

  markRead(id: string): Promise<void> {
    return api.post<void>(`/notifications/${id}/read`)
  },

  markAllRead(): Promise<void> {
    return api.post<void>("/notifications/read-all")
  },
}
