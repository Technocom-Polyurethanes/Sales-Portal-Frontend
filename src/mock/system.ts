import { roleCan } from "../features/account/permissions"
import { ApiError } from "../lib/api/types"
import type { SystemStatus } from "../features/system/types"

import { sessionAccount } from "./db"
import type { Route } from "./transport"

/** Demo scenarios for screenshots and local QA; the real API ignores this query param. */
function scenario(): string {
  if (typeof window === "undefined") return ""
  return new URLSearchParams(window.location.search).get("scenario") ?? ""
}

function status(): SystemStatus {
  const demo = scenario()
  const down = demo === "unhealthy"
  const degraded = demo === "degraded" || demo === "dropped"

  return {
    status: down ? "Unhealthy" : degraded ? "Degraded" : "Healthy",
    checkedAt: new Date().toISOString(),
    version: "1.11.0",
    environment: "Production",
    uptimeSeconds: 1_416_000,
    startedAt: new Date(Date.now() - 1_416_000_000).toISOString(),
    commit: "e045a40",
    apiVersion: "1.11.0",
    database: {
      status: down ? "Down" : "Up",
      latencyMs: down ? 0 : 24,
      latencyHistory: down
        ? []
        : [
            18, 22, 19, 25, 21, 28, 24, 20, 23, 26, 19, 25, 22, 21, 27, 24, 20,
            26, 23, 22,
          ],
      serverVersion: "PostgreSQL 16.2",
      sizeBytes: 1_510_500_000,
      connectionsUsed: 12,
      connectionsMax: 100,
      pendingMigrations: demo === "migrations" ? 2 : 0,
      lastMigration: "20261120_AddAuditDetails",
    },
    live: {
      state: degraded || down ? "disconnected" : "connected",
      disabled: false,
      pollingFallback: degraded || down,
      changes: degraded || down ? "disconnected" : "connected",
      notifications: down ? "disconnected" : "connected",
      changesLastEventAt: new Date(Date.now() - 12_000).toISOString(),
      notificationsLastEventAt: new Date(Date.now() - 45_000).toISOString(),
      reconnectCount: degraded ? 4 : 0,
      lastError: degraded ? "SSE stream closed: pooler connection reset" : null,
    },
    realtime: {
      connectedClients: down ? 0 : 7,
      notificationQueueDepth: 0,
      dropped: demo === "dropped" ? 3 : 0,
    },
    audit: {
      rowsTotal: 1234,
      queueDepth: 0,
      dropped: 0,
      lastWriteAt: new Date(Date.now() - 120_000).toISOString(),
      retentionDays: 365,
    },
    jobs: [
      {
        name: "Send expiry reminders",
        lastRunAt: new Date(Date.now() - 600_000).toISOString(),
        durationMs: 240,
        result: "success",
        nextRunAt: new Date(Date.now() + 3_000_000).toISOString(),
      },
      {
        name: "Refresh catalogue",
        lastRunAt: new Date(Date.now() - 3_600_000).toISOString(),
        durationMs: 1800,
        result: "success",
        nextRunAt: new Date(Date.now() + 7_200_000).toISOString(),
      },
    ],
    security: {
      failedSignIns24h: 6,
      lastFailedSignInAt: new Date(Date.now() - 1_800_000).toISOString(),
      activeUsers: 12,
      inactiveUsers: 3,
    },
    data: { offers: 428, customers: 96, materials: 312, activeUsers: 12 },
  }
}

export const systemRoutes: Route[] = [
  {
    method: "GET",
    segments: ["system", "status"],
    handle: () => {
      if (!roleCan(sessionAccount().role, "system.view")) {
        throw new ApiError("You do not have permission to do that.", 403)
      }
      return status()
    },
  },
]
