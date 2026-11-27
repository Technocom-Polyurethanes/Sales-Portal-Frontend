import { api } from "../../lib/api/client"

import type { PaginatedResult } from "../../lib/api/lookup"

import type {
  AuditFilterOptions,
  AuditLog,
  AuditLogPage,
  AuditLogQuery,
} from "./types"

export const AUDIT_PAGE_SIZE = 20

function dayStart(value: string | undefined) {
  return value ? `${value}T00:00:00.000Z` : undefined
}

function dayEnd(value: string | undefined) {
  return value ? `${value}T23:59:59.999Z` : undefined
}

export const auditApi = {
  list(params: AuditLogQuery = {}): Promise<PaginatedResult<AuditLog>> {
    return api
      .get<AuditLogPage>("/audit-logs", {
        search: params.search?.trim() || undefined,
        from: dayStart(params.from),
        to: dayEnd(params.to),
        actorId: params.actorId || undefined,
        category: params.category || undefined,
        action: params.action || undefined,
        outcome: params.outcome || undefined,
        page: params.page ?? 1,
        pageSize: params.pageSize ?? AUDIT_PAGE_SIZE,
      })
      .then((result) => ({
        ...result,
        totalPages: Math.max(1, Math.ceil(result.totalCount / result.pageSize)),
      }))
  },

  filters(): Promise<AuditFilterOptions> {
    return api.get<AuditFilterOptions>("/audit-logs/filters")
  },
}
