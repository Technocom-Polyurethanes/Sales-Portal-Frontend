import { api } from "../../lib/api/client"
import type { Query } from "../../lib/api/types"

import type { PaginatedResult } from "../../lib/api/lookup"

import type {
  AuditFilterOptions,
  AuditLog,
  AuditLogPage,
  AuditLogQuery,
  AuditSummary,
} from "./types"

export const AUDIT_PAGE_SIZE = 50

function dayStart(value: string | undefined) {
  return value ? `${value}T00:00:00.000Z` : undefined
}

function dayEnd(value: string | undefined) {
  return value ? `${value}T23:59:59.999Z` : undefined
}

export function auditQuery(params: AuditLogQuery): Query {
  return {
    search: params.search?.trim() || undefined,
    from: dayStart(params.from),
    to: dayEnd(params.to),
    actorId: params.actorId || undefined,
    category: params.category || undefined,
    action: params.action || undefined,
    outcome: params.outcome || undefined,
    entityType: params.entityType || undefined,
    page: params.page ?? 1,
    pageSize: params.pageSize ?? AUDIT_PAGE_SIZE,
  }
}

type SummaryBucket = {
  key: string
  count: number
}

type AuditSummaryResponse = {
  totalCount?: number
  byAction?: SummaryBucket[]
  byCategory?: SummaryBucket[]
  byOutcome?: SummaryBucket[]
  byActor?: SummaryBucket[]
  byDay?: Array<SummaryBucket | number>
  actions?: number
  failures?: number
  signIns?: number
  failedSignIns?: number
  activeUsers?: number
  lastFailedSignInAt?: string | null
  lastFailedSignInUsername?: string | null
  byHour?: number[]
}

function countWhere(buckets: SummaryBucket[] | undefined, key: string) {
  return buckets?.find((item) => String(item.key).toLowerCase() === key)?.count
}

/** The backend returns buckets; the screen needs counts and a plain timeline. */
function normalizeSummary(raw: AuditSummaryResponse): AuditSummary {
  const byDay = Array.isArray(raw.byDay)
    ? raw.byDay.map((item) =>
        typeof item === "number" ? item : (item.count ?? 0),
      )
    : undefined
  const byDayKeys = Array.isArray(raw.byDay)
    ? raw.byDay
        .map((item) => (typeof item === "number" ? "" : item.key))
        .filter(Boolean)
    : undefined

  return {
    actions: raw.actions ?? raw.totalCount,
    failures: raw.failures ?? countWhere(raw.byOutcome, "failure"),
    signIns: raw.signIns ?? countWhere(raw.byCategory, "auth"),
    failedSignIns: raw.failedSignIns,
    activeUsers: raw.activeUsers ?? raw.byActor?.length,
    lastFailedSignInAt: raw.lastFailedSignInAt,
    lastFailedSignInUsername: raw.lastFailedSignInUsername,
    byHour: raw.byHour,
    byDay,
    byDayKeys,
  }
}

export const auditApi = {
  list(params: AuditLogQuery = {}): Promise<PaginatedResult<AuditLog>> {
    return api
      .get<AuditLogPage>("/audit-logs", auditQuery(params))
      .then((result) => ({
        ...result,
        totalPages: Math.max(1, Math.ceil(result.totalCount / result.pageSize)),
      }))
  },

  filters(): Promise<AuditFilterOptions> {
    return api.get<AuditFilterOptions>("/audit-logs/filters")
  },

  summary(params: AuditLogQuery = {}): Promise<AuditSummary> {
    return api
      .get<AuditSummaryResponse>("/audit-logs/summary", auditQuery(params))
      .then(normalizeSummary)
  },

  /** A blob download through the shared transport, so mock and HTTP agree. */
  async exportCsv(params: AuditLogQuery = {}): Promise<{
    blob: Blob
    filename: string
  }> {
    const result = await api.request<unknown>("/audit-logs/export", {
      method: "GET",
      query: auditQuery(params),
      responseType: "blob",
    })
    if (typeof result === "string") {
      return {
        blob: new Blob([result], { type: "text/csv" }),
        filename: "audit-log.csv",
      }
    }
    const payload = result as {
      blob: Blob
      filename?: string
    }
    return { blob: payload.blob, filename: payload.filename ?? "audit-log.csv" }
  },
}
