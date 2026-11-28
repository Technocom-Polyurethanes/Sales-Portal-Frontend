import type { BadgeVariant } from "../../../components/ui/Badge"
import type { TranslateFunction } from "../../../i18n/I18nProvider"
import type { TranslationKey } from "../../../i18n/types"
import type { Locale } from "../../../lib/formatters/locale"
import { formatNumber, splitUptime } from "../../../lib/formatters/relative"
import type { SystemStatus } from "../types"

export type Insight = {
  reasonKey: TranslationKey
  nextKey: TranslationKey
  tone: BadgeVariant
  count?: number
}

export function stateTone(value: string | null | undefined): BadgeVariant {
  const key = (value ?? "").toLowerCase()
  if (["healthy", "up", "connected", "success"].includes(key)) return "accepted"
  if (["unhealthy", "down", "disconnected", "failure"].includes(key))
    return "rejected"
  if (["degraded", "reconnecting"].includes(key)) return "draft"
  return "neutral"
}

/** One plain-language diagnosis, derived from the payload in priority order. */
export function statusInsight(status: SystemStatus): Insight {
  const databaseDown = status.database.status.toLowerCase() === "down"
  if (databaseDown || status.status.toLowerCase() === "unhealthy") {
    return {
      reasonKey: "system.reasons.database",
      nextKey: "system.next.database",
      tone: "rejected",
    }
  }

  const listenerDown =
    status.live.pollingFallback ||
    [status.live.changes, status.live.notifications].some(
      (channel) => channel.toLowerCase() === "disconnected",
    )
  if (listenerDown) {
    return {
      reasonKey: "system.reasons.listener",
      nextKey: "system.next.listener",
      tone: "draft",
    }
  }

  const pending = status.database.pendingMigrations ?? 0
  if (pending > 0) {
    return {
      reasonKey: "system.reasons.migrations",
      nextKey: "system.next.migrations",
      tone: "draft",
      count: pending,
    }
  }

  if ((status.realtime?.dropped ?? 0) > 0) {
    return {
      reasonKey: "system.reasons.dropped",
      nextKey: "system.next.dropped",
      tone: "draft",
    }
  }

  return {
    reasonKey: "system.reasons.healthy",
    nextKey: "system.next.healthy",
    tone: "accepted",
  }
}

export function uptimeText(seconds: number, t: TranslateFunction): string {
  const { days, hours, minutes } = splitUptime(seconds)
  return `${days}${t("system.units.d")} ${hours}${t("system.units.h")} ${minutes}${t("system.units.m")}`
}

export function msText(
  value: number | null | undefined,
  locale: Locale,
  t: TranslateFunction,
): string {
  if (value === null || value === undefined) return "—"
  return t("system.units.ms", { count: formatNumber(value, locale) })
}

export function diagnosticsText(status: SystemStatus): string {
  return JSON.stringify(status, null, 2)
}
