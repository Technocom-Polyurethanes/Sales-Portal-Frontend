import { ApiError, type Query } from "../lib/api/types"

import { roleCan } from "../features/account/permissions"

import { auditLogs } from "./data/auditLogs"

import { db, sessionAccount } from "./db"

import type { Route } from "./transport"

const CATEGORIES = [
  "auth",

  "offers",

  "customers",

  "materials",

  "banks",

  "catalog",

  "settings",

  "users",

  "imports",
]

const ACTIONS = [
  "auth.login",

  "auth.login_failed",

  "auth.password_changed",

  "offer.created",

  "offer.updated",

  "offer.revised",

  "offer.status_changed",

  "offer.deleted",

  "offer.document_opened",

  "customer.created",

  "customer.updated",

  "customer.deleted",

  "material.created",

  "material.updated",

  "material.deleted",

  "bank.created",

  "bank.updated",

  "bank.deleted",

  "catalog.payment_term_created",

  "catalog.payment_term_updated",

  "settings.updated",

  "user.created",

  "user.updated",

  "user.password_reset",

  "user.deleted",

  "import.committed",
]

function requireAdmin() {
  if (!roleCan(sessionAccount().role, "audit.view")) {
    throw new ApiError("You do not have permission to do that.", 403)
  }
}

function matchingLogs(query: Query) {
  const search = String(query.search ?? "")

    .trim()

    .toLowerCase()

  const from = String(query.from ?? "")

  const to = String(query.to ?? "")

  const matches = auditLogs

    .filter((log) => {
      if (from && log.occurredAt < from) return false

      if (to && log.occurredAt > to) return false

      if (query.actorId && log.actorUserId !== String(query.actorId))
        return false

      if (query.category && log.category !== String(query.category))
        return false

      if (query.action && log.action !== String(query.action)) return false

      if (query.outcome && log.outcome !== String(query.outcome)) return false

      if (query.entityType && log.entityType !== String(query.entityType))
        return false

      if (query.entityId && log.entityId !== String(query.entityId))
        return false

      if (!search) return true

      return [log.description, log.entityLabel ?? "", log.actorUsername].some(
        (value) => value.toLowerCase().includes(search),
      )
    })

    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))

  return matches
}

function findLogs(query: Query) {
  const matches = matchingLogs(query)

  const pageSize = Math.max(1, Number(query.pageSize ?? 20))

  const totalPages = Math.max(1, Math.ceil(matches.length / pageSize))

  const page = Math.min(Math.max(1, Number(query.page ?? 1)), totalPages)

  return {
    items: matches.slice((page - 1) * pageSize, page * pageSize),

    page,

    pageSize,

    totalCount: matches.length,

    totalPages,
  }
}

export const auditRoutes: Route[] = [
  {
    method: "GET",

    segments: ["audit-logs", "filters"],

    handle: () => {
      requireAdmin()

      return {
        actors: db.accounts

          .map(({ id, username, fullName }) => ({ id, username, fullName }))

          .sort((a, b) => a.username.localeCompare(b.username)),

        categories: CATEGORIES,

        actions: ACTIONS,
      }
    },
  },

  {
    method: "GET",

    segments: ["audit-logs", "summary"],

    handle: ({ query }) => {
      requireAdmin()

      const logs = matchingLogs(query)

      const byHour = Array<number>(24).fill(0)

      const byDay = Array<number>(30).fill(0)

      const failedSignIns = logs.filter(
        (log) => log.category === "auth" && log.outcome === "failure",
      )

      for (const log of logs) {
        const date = new Date(log.occurredAt)

        byHour[date.getHours()] += 1

        const daysAgo = Math.floor((Date.now() - date.getTime()) / 86_400_000)

        if (daysAgo >= 0 && daysAgo < 30) byDay[29 - daysAgo] += 1
      }

      const lastFailed = failedSignIns[0]

      return {
        actions: logs.length,

        failures: logs.filter((log) => log.outcome === "failure").length,

        signIns: logs.filter(
          (log) => log.category === "auth" && log.outcome === "success",
        ).length,

        failedSignIns: failedSignIns.length,

        activeUsers: new Set(logs.map((log) => log.actorUserId).filter(Boolean))
          .size,

        lastFailedSignInAt: lastFailed?.occurredAt ?? null,

        lastFailedSignInUsername: lastFailed?.actorUsername ?? null,

        byHour,

        byDay,
      }
    },
  },

  {
    method: "GET",

    segments: ["audit-logs", "export"],

    handle: ({ query }) => {
      requireAdmin()

      const header = "id,occurredAt,actor,action,category,outcome,description\n"

      return (
        header +
        matchingLogs(query)

          .map((log) =>
            [
              log.id,

              log.occurredAt,

              log.actorUsername,

              log.action,

              log.category,

              log.outcome,

              `"${log.description.replace(/"/g, '""')}"`,
            ].join(","),
          )

          .join("\n")
      )
    },
  },

  {
    method: "GET",

    segments: ["audit-logs"],

    handle: ({ query }) => {
      requireAdmin()

      return findLogs(query)
    },
  },
]
