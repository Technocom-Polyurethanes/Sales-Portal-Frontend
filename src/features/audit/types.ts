import type { PaginatedResult } from "../../lib/api/lookup"

export type AuditLog = {
  id: string

  occurredAt: string

  actorUserId?: string | null

  actorUsername: string

  actorFullName: string

  actorRole?: string | null

  action: string

  category: string

  entityType?: string | null

  entityId?: string | null

  entityLabel?: string | null

  description: string

  outcome: string

  httpMethod?: string | null

  path?: string | null

  statusCode?: number | null

  ipAddress?: string | null

  details: Record<string, string>

  /** Optional enrichment from the audit-actor-and-insights backend contract. */

  userAgentLabel?: string | null

  durationMs?: number | null

  entityRoute?: string | null
}

export type AuditSummary = {
  actions?: number

  failures?: number

  signIns?: number

  failedSignIns?: number

  activeUsers?: number

  lastFailedSignInAt?: string | null

  lastFailedSignInUsername?: string | null

  byHour?: number[]

  byDay?: number[]

  byDayKeys?: string[]
}

export type AuditActor = {
  id: string

  username: string

  fullName: string
}

export type AuditFilterOptions = {
  actors: AuditActor[]

  categories: string[]

  actions: string[]
}

export type AuditLogQuery = {
  search?: string

  from?: string

  to?: string

  actorId?: string

  category?: string

  action?: string

  outcome?: string

  entityType?: string

  entityId?: string

  page?: number

  pageSize?: number
}

/** The API omits `totalPages`; the shared table component needs it. */

export type AuditLogPage = Omit<PaginatedResult<AuditLog>, "totalPages">
