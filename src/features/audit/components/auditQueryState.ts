import { AUDIT_PAGE_SIZE } from "../api"
import type { AuditLog, AuditLogQuery } from "../types"

export type AuditPreset = "today" | "yesterday" | "seven" | "thirty" | "custom"

export type AuditQueryState = {
  search: string
  from: string
  to: string
  actorId: string
  category: string
  action: string
  outcome: string
  preset: AuditPreset
  entityType: string
  entityId: string
  page: number
  pageSize: number
}

export const PRESETS: AuditPreset[] = [
  "today",
  "yesterday",
  "seven",
  "thirty",
  "custom",
]

export const PAGE_SIZES = [10, 25, 50, 100]

const PRESET_SET = new Set<string>(PRESETS)

function isoDay(date: Date): string {
  const pad = (part: number) => String(part).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function daysAgo(today: Date, days: number): string {
  const date = new Date(today)
  date.setDate(date.getDate() - days)
  return isoDay(date)
}

export function presetRange(preset: AuditPreset, today = new Date()) {
  if (preset === "yesterday") return [daysAgo(today, 1), daysAgo(today, 1)]
  if (preset === "seven") return [daysAgo(today, 6), isoDay(today)]
  if (preset === "thirty") return [daysAgo(today, 29), isoDay(today)]
  if (preset === "custom") return ["", ""]
  return [isoDay(today), isoDay(today)]
}

export function parseAuditState(
  params: URLSearchParams,
  today = new Date(),
): AuditQueryState {
  const raw = params.get("preset") ?? ""
  const preset = PRESET_SET.has(raw)
    ? raw as AuditPreset
    : params.has("from") || params.has("to")
      ? "custom"
      : "today"
  const [defaultFrom, defaultTo] = presetRange(preset, today)
  const page = Number(params.get("page"))
  const pageSize = Number(params.get("pageSize"))
  return {
    search: params.get("search") ?? "",
    from: params.get("from") ?? defaultFrom,
    to: params.get("to") ?? defaultTo,
    actorId: params.get("actorId") ?? "",
    category: params.get("category") ?? "",
    action: params.get("action") ?? "",
    outcome: params.get("outcome") ?? "",
    preset,
    entityType: params.get("entityType") ?? "",
    entityId: params.get("entityId") ?? "",
    page: Number.isInteger(page) && page > 0 ? page : 1,
    pageSize: PAGE_SIZES.includes(pageSize) ? pageSize : AUDIT_PAGE_SIZE,
  }
}

export function auditQueryParams(state: AuditQueryState): URLSearchParams {
  const params = new URLSearchParams()
  const values: Record<string, string> = {
    preset: state.preset,
    search: state.search,
    from: state.from,
    to: state.to,
    actorId: state.actorId,
    category: state.category,
    action: state.action,
    outcome: state.outcome,
    entityType: state.entityType,
    entityId: state.entityId,
  }
  for (const [key, value] of Object.entries(values)) {
    if (value) params.set(key, value)
  }
  if (state.page > 1) params.set("page", String(state.page))
  if (state.pageSize !== AUDIT_PAGE_SIZE) {
    params.set("pageSize", String(state.pageSize))
  }
  return params
}

/** Paging is a view concern: summaries and exports cover every matching row. */
export function auditRequest(state: AuditQueryState): AuditLogQuery {
  return {
    search: state.search,
    from: state.from,
    to: state.to,
    actorId: state.actorId,
    category: state.category,
    action: state.action,
    outcome: state.outcome,
    entityType: state.entityType,
    entityId: state.entityId,
    page: state.page,
    pageSize: state.pageSize,
  }
}

export function auditFilterRequest(state: AuditQueryState): AuditLogQuery {
  const { page: _page, pageSize: _size, ...filters } = auditRequest(state)
  return filters
}

export function activeFilterCount(state: AuditQueryState): number {
  return [
    state.actorId,
    state.category,
    state.action,
    state.outcome,
    state.entityType,
    state.entityId,
  ].filter(Boolean).length
}

export function isRangeOnly(state: AuditQueryState): boolean {
  return activeFilterCount(state) === 0 && !state.search
}

/** New rows either jump in place (at the top) or queue behind the live pill. */
export function newAuditRows(
  previous: Set<string> | null,
  items: AuditLog[],
  atTop: boolean,
  page: number,
) {
  const ids = new Set(items.map((row) => row.id))
  if (!previous) return { ids, fresh: [] as string[], pending: 0 }
  const fresh = items
    .filter((row) => !previous.has(row.id))
    .map((row) => row.id)
  return {
    ids,
    fresh,
    pending: fresh.length > 0 && (!atTop || page > 1) ? fresh.length : 0,
  }
}

export function isLongRange(state: AuditQueryState): boolean {
  if (!state.from || !state.to) return false
  const from = new Date(`${state.from}T00:00:00`).getTime()
  const to = new Date(`${state.to}T00:00:00`).getTime()
  return Number.isFinite(from) && Number.isFinite(to)
    ? (to - from) / 86_400_000 > 3
    : false
}
